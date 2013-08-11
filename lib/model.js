/*jslint node:true, nomen:true, plusplus:true */

var _ = require('lodash'), validator = require('./validator').validate,
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
		
		validate = function (attrs,mode) {
			var err = {};
			
			if (fields) {
				/*
				 * do not allow any fields we have not previously registered, unless no fields were registered
				 */
				// first check that we are not adding fields that are disallowed
				_.each(attrs || {},function(val,key){
					// allow prototype for js api, and _id & _rev for couch API
					if (!IGNOREFIELDS[key] && !fields[key]) {
						err[key] = "unknownfield";
					}
				});
				// next check that each field that is required is present, and that each field meets its validation tests
				// when do we do things differently? depends on 'mode'
				// get - EVERYTHING must be there
				// create - everything must be there except a field flagged 'createoptional'
				// update - nothing must be there, but that which is must pass validation
				_.each(fields,function(value,key){
					var valid = true, i, val, msg = "invalid", tmp = [];
					if (value !== undefined) {
						// if the field is required, make sure it is there, unless we are one of:
						// - in update mode
						// - in create mode and value.createoptional === true
						if (attrs[key] === undefined) {
							// do not even move to other validations if it is required and empty
							if (value.required && (mode === "get" || mode === "find" || mode === "patch" || (mode === "create" && !value.createoptional))) {
								err[key] = "required";
							}
						} else if (value.mutable === false && (mode === "update" || mode === "patch")) {
							err[key] = "immutable";
						} else if (value.validation) {
							val = [].concat(value.validation);
							for (i=0;i<val.length;i++) {
								if (typeof(val[i]) === "string") {
								  valid = validator(attrs[key],val[i]);
								  msg = val[i];
								} else if (typeof(val[i]) === "function") {
									// run a function
									valid = val[i](name,key,mode,attrs);
								}
								// must return one of:
								// 1- the value true, therefore all is OK
								// 2- the value false/null/undefine, in which case it is not
								// 3- an object with the following attributes
								//		valid:true/false // required
								//		message: some message, // for valid === false, optional
								//		value: new value // for true, if we do not want to use existing value, optional
								// no object will be treated as false/invalid
								if (!valid) {
									tmp.push(msg);
								} else if (valid !== true) {
									if (valid.valid) {
										if (valid.value) {
											attrs[key] = valid.value;
										}
									} else {
										tmp.push(valid.message || "invalid");
									}
								}
							}
							switch(tmp.length) {
								case 0:
									delete err[key];
									break;
								case 1:
									err[key] = tmp[0];
									break;
								default:
									err[key] = tmp;
							}
						}
					}
				});				
			}

			return ( _.size(err) > 0 ? err : null );
		};
		
		checkUnique = function (attrs,callback) {
			var u = [];
			// build up our unique cases, but take into account attributes
			// unique is an array, each element of which is an array of field names
			// e.g. [[name],[firstname,lastname]]
			//  each element in the parent array must be unique. In the example above, no two items
			//    can have the same name.
			//    if the element has more than one item, then the combination must be unique. In the example above,
			//    no two items can share firstname && lastname
			//  Completing the above example, no two items can share: (name) OR (firstname && lastname)
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
			if (u.length > 0) {
				M.find({_join:"OR",terms:u},function (err,res) {
					var conflicts = [];
					if (err) {
						// error server-side, just send it back
						callback(err,res);
					} else if (!res || res.length < 1){
						// no matches, so our new one is unique, just send it off
						callback(null,null);
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
						callback(conflicts.length > 0 ? conflicts : null,res);
					}
				});
			} else {
				callback();
			}			
		};
		
		M = {
			get: function (key,parent,callback) {
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				db.get(table,key,function (err,res) {
					if (err) {
						callback(err);
					} else {
						// pass it through validate
						callback(validate(res,"get") || null,res);
					}
				});
			},
			find: function (search,parent,callback) {
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				db.find(table,search,function (err,res) {
					var errors = [];
					if (err) {
						callback(err);
					} else {
						// pass each one through validate
						_.each(res||[],function (r) {
							var v = validate(r,"find");
							if (v) {
								errors.push(v);
							}
						});
						callback(errors.length > 0 ? errors : null,res);
					}
				});
			},
			create: function (model,parent,callback) {
				var errors;
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				// validate
				errors = validate(model,"create");
				if (errors) {
					callback(errors,model);
				} else {
					// check for uniques
					checkUnique(model,function (errors) {
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
			},
			update: function (key,model,parent,callback) {
				var errors;
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				// validate
				model = model || {};
				key = key === 'undefined' || key === null ? model[id] : key;
				errors = validate(model,"update");
				if (errors) {
					callback(errors,model);
				} else {
					// check for uniques
					checkUnique(model,function (errors) {
						if (errors) {
							callback(errors,model);
						} else {
							doPresave(model,function (errors,res) {
								if (errors) {
									callback(errors,res);
								} else {
									// make sure we keep the same ID field
									model[id] = model[id] || key;
									db.update(table,key,model,callback);
								}
							});
						}
					});
				}
			},
			patch: function (key,model,parent,callback) {
				var errors;
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				// validate
				model = model || {};
				key = key === 'undefined' || key === null ? model[id] : key;
				errors = validate(model,"patch");
				if (errors) {
					callback(errors,model);
				} else {
					// check for uniques
					checkUnique(model,function (errors) {
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
			},
			destroy: function (key,parent,callback) {
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				db.destroy(table,key,callback);
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
