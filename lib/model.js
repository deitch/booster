/*jslint node:true, nomen:true, plusplus:true */

var _ = require('lodash'), async = require('async'), validator = require('./validator').validate,
sjs = require('searchjs'), logger, IGNOREFIELDS = {"prototype":true,"_id":true,"_rev":true};


// we do not really like backbone syntax, so we are overriding it a bit
module.exports = {
	generate : function(name,models,db,module) {
		var M, validate, checkUnique, fields, table, extend, unique, presave, getVisibility, doPresave, id;
		module = module || {};
		table = module.name || name || "";
		fields = module.fields;
		extend = module.extend || {};
		unique = module.unique || [];
		id = module.id || "id";
		
		presave = module.presave;
		
		getVisibility = function(f) {
			// if fields are not defined, then everything is public
		  return(fields ? fields[f] || "public" : "public");
		};
		
		doPresave = function(attrs,callback) {
			// is there a presave function?
			if (presave && typeof(presave) === "function") {
				presave(attrs,models,callback);
			} else {
				callback();
			}
		};		
		
		validate = function (attrs,mode,callback) {			
			if (fields) {
				
				// next check that each field that is required is present, and that each field meets its validation tests
				// when do we do things differently? depends on 'mode'
				// get - EVERYTHING must be there
				// create - everything must be there except a field flagged 'createoptional'
				// update - nothing must be there, but that which is must pass validation
				async.concat(_.keys(fields),function (key,callback) {
					var value = fields[key], ret = {};
					if (value !== undefined) {
						// if the field is required, make sure it is there, unless we are one of:
						// - in update mode
						// - in create mode and value.createoptional === true
						if (attrs[key] === undefined) {
							// do not even move to other validations if it is required and empty
							if (value.required && (mode === "get" || mode === "find" || mode === "update" || (mode === "create" && !value.createoptional))) {
								ret[key] = "required";
								callback(null,ret);
							} else {
								callback();
							}
						} else if (value.mutable === false && (mode === "update" || mode === "patch")) {
							ret[key] = "immutable";
							callback(null,ret);
						} else if (value.validation) {
							async.concat([].concat(value.validation),function (v,callback) {
								var processValidation = function (valid,msg) {
									// must return one of:
									// 1- the value true, therefore all is OK
									// 2- the value false/null/undefine, in which case it is not
									// 3- an object with the following attributes
									//		valid:true/false // required
									//		message: some message, // for valid === false, optional
									//		value: new value // for true, if we do not want to use existing value, optional
									// no object will be treated as false/invalid
									if (!valid) {
										msg = msg || "invalid";
									} else if (valid !== true) {
										if (valid.valid) {
											if (valid.value) {
												attrs[key] = valid.value;
											}
										} else {
											msg = valid.message || "invalid";
										}
									} else {
										msg = null;
									}
									callback(null,msg);
								};
								if (typeof(v) === "string") {
								  processValidation(validator(attrs[key],v),v);
								} else if (typeof(v) === "function") {
									// run a function
									// is it sync or async?
									if (v.length === 5) {
										v(name,key,mode,attrs,processValidation);
									} else {
										processValidation(v(name,key,mode,attrs));
									}
								}
							},function (err,results) {
								var msg;
								switch(results.length) {
									case 0:
										break;
									case 1:
										msg = {};
										msg[key] = results[0];
										break;
									default:
										msg = {};
										msg[key] = results;
										break;
								}
								callback(null,msg);
							});
						} else {
							callback();
						}
					}
				},function (err,results) {
					// now need to build it correctly. Each entry in results is first item is key, rest are errors
					var ret = null;
					if (results && results.length > 0) {
						ret = _.reduce(results,function(result,item){_.extend(result,item); return(result);},{});
					}
					/*
					 * do not allow any fields we have not previously registered, unless no fields were registered
					 */
					// first check that we are not adding fields that are disallowed
					_.each(attrs || {},function(val,key){
						// allow prototype for js api, and _id & _rev for couch API
						if (!IGNOREFIELDS[key] && !fields[key]) {
							ret = ret || {};
							ret[key] = "unknownfield";
						}
					});
				
					
					callback ( null, ret );
				});
			} else {
				callback();
			}
		};
		
		checkUnique = function (attrs,key,patch,callback) {
			// build up our unique cases, but take into account attributes
			// unique is an array, each element of which is an array of field names
			// e.g. [[name],[firstname,lastname]]
			//  each element in the parent array must be unique. In the example above, no two items
			//    can have the same name.
			//    if the element has more than one item, then the combination must be unique. In the example above,
			//    no two items can share firstname && lastname
			//  Completing the above example, no two items can share: (name) OR (firstname && lastname)

			// it is important to remember that we support PATCH, so the attrs might only contain one of the elements
			// continuing the above example, if attrs = {firstname:"foo"}, we would have to check it, because it might be that
			//     the item being PATCHed *already* has a lastname set to something, and changing just firstname triggers the conflict
			//     for example, we have 2 items:
			//     {firstname:"jill",lastname:"jones"}
			//     {firstname:"jim",lastname:"jones"}
			// it is sufficient to PATCH just firstname on the first record to "jim" to trigger a conflict
			//    hence, if this is a PATCH, we need first retrieve the record, see what it would become, and then match it
			async.waterfall([
				function (cb) {
					if (patch) {
						M.get(key,null,function(err,item){
							cb(null,_.extend({},item,attrs));
						});
					} else {
						cb(null,attrs);
					}
				},
				function (attrs,cb) {
					var u = [];
					_.each(unique||[],function (rule,i) {
						var tmp = {}, haveProp = true;
						_.each(rule?[].concat(rule):[],function (key) {
							if (key && attrs[key]) {
								tmp[key] = attrs[key];
							} else {
								haveProp = false;
							}
							return(haveProp);
						});
				
						if (haveProp) {
							u.push(tmp);
						}
					});
					cb(null,u);
				},
				function (u,cb) {
					if (u.length > 0) {
						M.find({_join:"OR",terms:u},function (err,res) {
							var conflicts = [];
							if (err) {
								// error server-side, just send it back
								cb(err,conflicts,res);
							} else if (!res || res.length < 1){
								// no matches, so our new one is unique, just send it off
								cb(null,conflicts,res);
							} else {
								// record that we were non-unique - SHOULD SAY WHAT IS NOT UNIQUE!!
								// go through each one in the collection, see where the conflict is, record it
								_.each(u,function (check) {
									_.each(res||[],function (item) {
										var tmp = {};
									  // *** it is NOT a conflict if the ID matches ***
										if (sjs.matchObject(item,check) && item[id] !== attrs[id]) {
											tmp[_.keys(check).join("_")] = "notunique";
											conflicts.push(tmp);
										}
									});							
								});
								cb(null,conflicts,res);
							}
						});
					} else {
						cb(null,[],null);
					}			
				}
			],function (err,conflicts,res) {
				callback(conflicts && conflicts.length > 0 ? conflicts : null,res);
			});
		};
		
		M = {
			get: function (key,parent,callback) {
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				db.get(table,key,function (err,res) {
					var set;
					if (err) {
						callback(err);
					} else if (!res || res.length < 1){
						callback(null,res);
					} else {
						// get only those that match the parent
						set = sjs.matchArray(res?[].concat(res):[],parent||{});
						// pass it through validate
						async.concat(set,function (r,cb) {
							validate(r,"get",cb);
						},function (errors,verrs) {
							callback(verrs && verrs.length > 0 ? verrs : null , set.length > 1 ? set : set[0]);							
						});
					}
				});
			},
			find: function (search,parent,callback) {
				var fulls;
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				fulls = _.extend({},search,parent);
				db.find(table,fulls,function (err,res) {
					if (err) {
						callback(err);
					} else {
						// pass it through validate
						async.concat(res||[],function (r,cb) {
							validate(r,"find",cb);
						},function (errors,verrs) {
							callback(verrs && verrs.length > 0 ? verrs : null,res);							
						});
					}
				});
			},
			create: function (model,parent,callback) {
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				// validate
				validate(model,"create",function(e,verrs){
					if (verrs) {
						callback(verrs,model);
					} else {
						// check for uniques
						checkUnique(model,null,false,function (errors) {
							if (errors) {
								callback(errors,model);
							} else {
								doPresave(model,function (errors,res) {
									if (errors) {
										callback(errors,res);
									} else {
										db.create(table,model,callback);
									}
								});
							}
						});
					}
				});
			},
			update: function (key,model,parent,callback) {
				var mutreq = [], nextStep = function() {
					// check for uniques
					checkUnique(model,key,false,function (errors) {
						if (errors) {
							callback(errors,model);
						} else {
							doPresave(model,function (errors,res) {
								if (errors) {
									callback(errors,res);
								} else {
									// make sure we keep the same ID field
									model[id] = key;
									db.update(table,key,model,callback);
								}
							});
						}
					});
				};
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				// validate
				model = model || {};
				key = key === 'undefined' || key === null ? model[id] : key;
				
				validate(model,"update",function (e,errors) {
					// did we have any errors other than validation:required for mutable:false fields?
					_.each(errors||{},function (val,key) {
						if(val === "required" && (fields[key].mutable === false || key === id)) {
							mutreq.push(key);
							delete errors[key];
						}
					});
				
					if (_.size(errors) > 0) {
						callback(errors,model);
					} else {
						if (mutreq.length > 0) {
							db.get(table,key,function (err,res) {
								if (res) {
									// only extend those fields that are in mutreq
									model = _.extend({},_.pick(res,mutreq),model);
									nextStep();
								} else {
									callback(err,model);
								}
							});
						} else {
							nextStep();
						}
					}
				});
			},
			patch: function (key,model,parent,callback) {
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				// validate
				model = model || {};
				key = key === 'undefined' || key === null ? model[id] : key;
				validate(model,"patch",function (e,errors) {
					if (errors) {
						callback(errors,model);
					} else {
						// check for uniques
						checkUnique(model,key,true,function (errors) {
							if (errors) {
								callback(errors,model);
							} else {
								doPresave(model,function (errors,res) {
									if (errors) {
										callback(errors,res);
									} else {
										db.patch(table,key,model,callback);
									}
								});
							}
						});
					}
				});
			},
			destroy: function (key,parent,callback) {
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				db.destroy(table,key,callback);
			},
			mutable: function (field) {
				return(fields && fields[field] && fields[field].hasOwnProperty("mutable") ? !!fields[field].mutable : true);
			},
			filter: function (model,visibility) {
				// default is public, next is private, next is secret
				
				// need to account for model being an array or an object
				var ret = model;
				if (fields) {
					ret = _.map([].concat(model),function (item) {
						var single = {};
						switch(visibility) {
							case "secret": 
								single = item;
								break;
							case "private":
								_.each(item,function (val,key) {
									if (!fields[key] || !fields[key].visible || fields[key].visible !== "secret") {
										single[key] = val;
									}
								});
								break;
							default:
								_.each(item,function (val,key) {
									if (!fields[key] || !fields[key].visible || (fields[key].visible !== "secret" && fields[key].visible !== "private")) {
										single[key] = val;
									}
								});
								break;
						}
						return(single);
					});
					if (!_.isArray(model)) {
						ret = ret[0];
					}
				}
				return(ret);
			}
		};
		
		// add the extensions
		_.extend(M,extend);
		
		return(M);
	}
};
