/*jslint node:true, nomen:true, plusplus:true, unused:vars */

var _ = require('lodash'), async = require('async'), validator = require('./validator').validate,
sjs = require('searchjs'), IGNOREFIELDS = {"prototype":true,"_id":true,"_rev":true},

getCleanmodel = function (model) {
	// need a clean model without $b fields
	return _.omit(model,function (val,key) {
		return(key.indexOf('$b.') === 0);
	});
};



// we do not really like backbone syntax, so we are overriding it a bit
module.exports = {
	generate : function(name,models,db,module) {
		var M, validate, checkUnique, fields, table, extend, unique, presave, getVisibility, doPresave, id,
		setDefaultValues, checkCascade, checkDelete, filterOverride = '$b.clear', filters, pps;
		
		module = module || {};
		table = module.name || name || "";
		fields = module.fields;
		extend = module.extend || {};
		unique = module.unique || [];
		id = module.id || "id";
		
		presave = module.presave;
		filters = module.filter || {};
		pps = module.post || {};
		
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
		
		// build the filters
		filters.get = filters.get || function(id,models,callback) {callback();};
		filters.find = filters.find || function(search,models,callback) {callback();};
		filters.update = filters.update || function(id,model,models,callback) {callback();};
		filters.patch = filters.patch || function(id,model,models,callback) {callback();};
		filters.create = filters.create || function(model,models,callback) {callback();};
		filters.destroy = filters.destroy || function(key,models,callback) {callback();};

		// build the post processors
		pps.get = pps.get || function(id,models,err,result,callback) {callback();};
		pps.find = pps.find || function(search,models,err,result,callback) {callback();};
		pps.update = pps.update || function(id,model,models,err,result,callback) {callback();};
		pps.patch = pps.patch || function(id,model,models,err,result,callback) {callback();};
		pps.create = pps.create || function(model,models,err,result,callback) {callback();};
		pps.destroy = pps.destroy || function(key,models,err,result,callback) {callback();};
		
		setDefaultValues = function(model) {
			_.each(fields||{},function (value,key) {
				if (model[key] === undefined && value.default !== undefined) {
					model[key] = value.default;
				}
			});
		};
		
		validate = function (vid,attrs,mode,callback) {			
			if (fields) {
				
				// next check that each field that is required is present, and that each field meets its validation tests
				// when do we do things differently? depends on 'mode'
				// get - EVERYTHING must be there
				// create - everything must be there except a field flagged 'createoptional' or one with a 'default' value
				// update - nothing must be there, but that which is must pass validation
				async.concat(_.keys(fields),function (key,callback) {
					var value = fields[key], ret = {};
					if (value !== undefined) {
						// if the field is required, make sure it is there, unless we are one of:
						// - in update mode
						// - in create mode and (value.createoptional === true or value.default !== undefined)
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
							async.concat([].concat( value.validation.valid || value.validation ),function (v,callback) {
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
								var msg, parentname = value.validation.parent, 
								checklist = typeof(value.validation.check) === "string" ? value.validation.check.split(',') : value.validation.check;
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
								// at this point, all "self-validation" is complete - just by checking our built-in validators
								//  or user-supplied validation functions
								// now we need to check if there are any "parent validations" to do
								// but only if we had no self-validation issues, i.e. msg is still undefined
								// also, do not check if our new value is not in our "check list"
								if ((mode === "create" || mode === "patch" || mode === "update") && !msg && parentname && fields[parentname] && models[parentname] &&
									(!checklist || checklist.indexOf(attrs[key]) >= 0)) {
									// so we have a parent to check
									// first, did we define the parent in our post/put/patch, or do we need to find out what it is?
									async.waterfall([
										function (cb) {
											if (attrs[parentname]) {
												cb(null,attrs[parentname]);
											} else if (vid && mode === "patch"){
												// we only bother retrieving it if it is a patch
												// create already has it on the object, and put overrides it anyways
												M.get(vid,null,function(err,item){
													cb(null,item[parentname]);
												});
											} else {
												cb(null,null);
											}
										},
										function (parentid,cb) {
											if (parentid) {
												models[parentname].get(parentid,function (err,data) {
													if (err || !data || data[key] !== attrs[key]) {
														cb("invalidparent");
													} else {
														cb(null);
													}
												});
											} else {
												cb(null);
											}
										}
									],function (err) {
										var result;
										if (err) {
											result = {};
											result[key] = "invalidparent";
										}
										callback(null,result);
									});
								} else {
									callback(null,msg);
								}
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
					// be sure to ignore anything that starts with $b.
					_.each(attrs || {},function(val,key){
						// allow prototype for js api, and _id & _rev for couch API
						if (!IGNOREFIELDS[key] && !fields[key] && key.indexOf('$b.') !== 0) {
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
								cb(err,null,res);
							} else if (!res || res.length < 1){
								// no matches, so our new one is unique, just send it off
								cb(null,null,res);
							} else {
								// record that we were non-unique - SHOULD SAY WHAT IS NOT UNIQUE!!
								// go through each one in the collection, see where the conflict is, record it
								_.each(u,function (check) {
									_.each(res||[],function (item) {
										var tmp = {};
									  // *** it is NOT a conflict if the ID matches ***
										if (sjs.matchObject(item,check) && item[id] !== key) {
											tmp[_.keys(check).join(":")] = "notunique";
											conflicts.push(tmp);
										}
									});
								});
								// here is where we need to flatten our conflicts
								if (conflicts && conflicts.length > 0) {
									conflicts = _.reduce(conflicts,function(result,item){_.extend(result,item); return result;},{});
								} else {
									conflicts = null;
								}
								cb(null,conflicts,res);
							}
						});
					} else {
						cb(null,null,null);
					}			
				}
			],function (err,conflicts,res) {
				callback(conflicts || null,res);
			});
		};
		
		// check if we cascade any values down
		checkCascade = function (key,model,callback) {
			// check each field and see if we updated it
			var updates = {};
			_.each(fields,function (val,key) {
				if (model[key] && val && val.cascade) {
					if (val.cascade.value === undefined || val.cascade.value === null || 
						val.cascade.value === model[key] || (_.isArray(val.cascade.value) && val.cascade.value.indexOf(model[key]) >= 0)) {
							// update each of val.cascade.children (if not array, convert to array) where that field[myname] === myid
							//  to model[key]
							_.each([].concat(val.cascade.children),function (child) {
								if (child) {
									updates[child] = updates[child] || {};
									updates[child][key] = model[key];
								}
							});
					}
				}
			});
			// updates now holds a list of each model we are to update, and the patch to apply
			async.each(_.keys(updates),function (mname,cb) {
				var search = {}, subfields;
				if (models[mname]) {
					search[name] = key;
					// need to override any filters for it
					subfields = models[mname].fields();
					_.each(subfields,function (val,key) {
						if (key !== name && val && val.filter && val.filter.default) {
							search[key] = val.filter.clear || filterOverride;
						}
					});
					models[mname].find(search,function (err,data) {
						if (data && data.length > 0) {
							async.each(_.pluck(data,id),function (id,cb) {
								models[mname].patch(id,updates[mname],cb);
							},function (err) {
								cb();
							});
						} else {
							cb();
						}
					});
				} else {
					cb();
				}
			},function (err) {
				callback();
			});
		};
		
		// callback is signature (err,data)
		checkDelete = function(key,parent,config,force,callback) {
			var policy, children, allow;
			config = config || {};
			policy = config.policy;
			children = config.children;
			allow = policy === undefined || policy === "allow" || (policy === "force" && force);
			if (!allow && children && models[children]) {
				// here is where the work is done
				// first see if we have any children
				async.waterfall([
					function (cb) {
						// first get our children
						var search = {};
						search[name] = key;
						models[children].find(search,function (err,data) {
							cb(null,data);
						});
					},
					function (childs,cb) {
						// what we do now depends on the policy
						if (childs && childs.length > 0) {
							switch (policy) {
								case "cascade":
									async.each(_.pluck(childs,id),function (id,cb) {
										models[children].destroy(id,parent,force,cb);
									},cb);
									break;
								case "prevent":
								case "force":
									// policy "prevent" never lets it through
									// policy "force" lets us ignore our children if ?force=true, but if we got here, by definition force=false
									cb({delete:"children"});
									break;
								default:
									cb();
									break;
							}
						} else {
							cb(null);
						}
					}
				],callback);
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
				filters.get(key,models,function (err) {
					if (err) {
						callback(err,null);
					} else {
						db.get(table,key,function (err,res) {
							var set;
							if (err) {
								pps.get(key,models,err,res,function (e) {
									callback(e||err);
								});
							} else if (!res || res.length < 1){
								pps.get(key,models,err,res,function (e) {
									callback(err,res);
								});
							} else {
								// get only those that match the parent
								set = sjs.matchArray(res?[].concat(res):[],parent||{});
								// pass it through validate
								async.concat(set,function (r,cb) {
									validate(key,r,"get",cb);
								},function (errors,verrs) {
									var errs = verrs && verrs.length > 0 ? verrs : null, data = set.length > 1 ? set : set[0];
									pps.get(key,models,errs,data,function (e) {
										callback(e||errs,data);
									});
								});
							}
						});
					}
				});
			},
			find: function (search,parent,callback) {
				var fulls, converted = {};
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				search = search || {};
				// add default, if we have it
				// this should probably be extracted to search time
				_.each(fields,function (val,key) {
					// check if a default search was defined
					if (val.filter && val.filter.default && !search[key]) {
						search[key] = val.filter.default;
					}
					// check if an override was defined
					if ((val.filter && val.filter.clear && search[key] === val.filter.clear) || (search[key] === filterOverride)) {
						delete search[key];
					}
				});
				
				// do we force conversion
				_.each(search,function (val,key) {
					if (key && val && fields && fields[key] && fields[key].type) {
						// it needs to be a supported type
						switch(fields[key].type) {
							case "integer":
								// convert string
								if (typeof(val) === "string") {
									converted[key] = parseInt(val,10);
								} else if (typeof(val) === "object") {
									converted[key] = _.clone(val);
									_.each(val,function (vval,vkey) {
										if (typeof(vval) === "string") {
											converted[key][vkey] = parseInt(vval,10);
										}
									});
								}
								break;
						case "boolean":
							if (typeof(val) === "string") {
								converted[key] = (val === "true") ? true : false;
							}
							break;
						}
					}
				});
				fulls = _.extend({},search,converted,parent);
				filters.find(search,models,function (err) {
					if (err) {
						callback(err,null);
					} else {
						db.find(table,fulls,function (err,res) {
							if (err) {
								pps.find(fulls,models,err,res,function (e) {
									callback(e||err);
								});
							} else {
								// pass it through validate
								async.concat(res||[],function (r,cb) {
									validate(r[id],r,"find",cb);
								},function (errors,verrs) {
									var errs = verrs && verrs.length > 0 ? verrs : null;
									pps.find(fulls,models,errs,res,function (e) {
										callback(e||errs,res);
									});
								});
							}
						});
					}
				});
			},
			create: function (model,parent,callback) {
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				// set default values
				setDefaultValues(model);
				// validate
				validate(null,model,"create",function(e,verrs){
					if (verrs) {
						callback(verrs,model);
					} else {
						// check for uniques
						checkUnique(model,null,false,function (errors) {
							if (errors) {
								callback(errors,model);
							} else {
								filters.create(model,models,function (err) {
									if (err) {
										callback(err);
									} else {
										doPresave(model,function (errors,res) {
											if (errors) {
												callback(errors,res);
											} else {
												db.create(table,getCleanmodel(model),function (err,res) {
													pps.create(model,models,err,res,function (e) {
														callback(e||err,res);
													});
												});
											}
										});
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
									filters.update(key,model,models,function (err) {
										if (err) {
											callback(err);
										} else {
											db.update(table,key,getCleanmodel(model),function (err,data) {
												// now check if there is any cascading to be done
												if (err) {
													pps.update(key,model,models,err,data,function (e) {
														callback(e||err,data);
													});
												} else {
													checkCascade(key,model,function () {
														pps.update(key,model,models,err,data,function (e) {
															callback(e||err,data);
														});
													});
												}
											});
										}
									});
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
				
				// set default values
				setDefaultValues(model);
				// validate
				validate(key,model,"update",function (e,errors) {
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
				validate(key,model,"patch",function (e,errors) {
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
										filters.update(key,model,models,function (err) {
											if (err) {
												callback(err);
											} else {
												db.patch(table,key,getCleanmodel(model),function (err,data) {
													// now check if there is any cascading to be done
													if (err) {
														pps.patch(key,model,models,err,data,function (e) {
															callback(e||err,data);
														});
													} else {
														checkCascade(key,model,function () {
															pps.patch(key,model,models,err,data,function (e) {
																callback(e||err,data);
															});
														});
													}
												});
											}
										});
									}
								});
							}
						});
					}
				});
			},
			destroy: function (key,parent,force,callback) {
				if (typeof(parent) === "function") {
					callback = parent;
					parent = null;
				} else if (typeof(force) === "function") {
					callback = force;
					force = null;
				}
				// now need to check if there are delete policies on the model
				checkDelete(key,parent,module.delete,force,function (err,data) {
					if (err) {
						callback(err,data);
					} else {
						filters.destroy(key,models,function (err) {
							if (err) {
								callback(err);
							} else {
								db.destroy(table,key,function (err,res) {
									pps.destroy(key,models,err,res,function (e) {
										callback(e||err,res);
									});
								});
							}
						});
					}
				});
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
			},
			fields: function () {
				return _.cloneDeep(fields);
			}
		};
		
		// add the extensions
		_.extend(M,extend);
		
		return(M);
	}
};
