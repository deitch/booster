/*jslint node:true, nomen:true, plusplus:true, unused:vars */

var _ = require('lodash'), async = require('async'), validator = require('./validator').validate,
sjs = require('searchjs'), IGNOREFIELDS = {"prototype":true,"_id":true,"_rev":true}, util = require('./util'),
modules = {}, DEFAULTID = "id";



// we do not really like backbone syntax, so we are overriding it a bit
module.exports = {
	generate : function(name,models,db,module) {
		var M, validate, checkUnique, fields, table, extend, unique, presave, doPresave, id, doEmbed,
		getRemote, getFarSide, setRemoteAssociations, patchFarSide, patchMM,
		setDefaultValues, checkCascade, checkDelete, filterOverride = '$b.clear', filters, pps, suppressUniqueError;
		
		module = module || {};
		table = module.name || name || "";
		fields = module.fields;
		extend = module.extend || {};
		unique = module.unique || [];
		id = module.id || DEFAULTID;
		suppressUniqueError = module.uniqueerror === false;
		
		// save all of our modules
		modules[name] = module;
		
		presave = module.presave;
		filters = module.filter || {};
		pps = module.post || {};
		
		doPresave = function(attrs,callback) {
			// is there a presave function?
			if (presave && typeof(presave) === "function") {
				presave(attrs,models,callback);
			} else {
				callback();
			}
		};
		
		// get those that belong to me
		// I can either get them based on my key, or I can get them based on their key
		getFarSide = function (remote,name,type) {
			var foreign = null;
			if (type === "has_one" || type === "has_many") {
				type = "belongs_to";
			}
			if (modules[remote] && modules[remote].fields && models[remote]) {
				_.each(modules[remote].fields,function (f,k) {
					if (f && f.association && f.association.type === type && (f.association.model === name || (f.association === undefined && k === name))) {
						// this is our field
						foreign = k;
						return false;
					}
				});
			}
			return(foreign);
		};
		getRemote = function (remote,type,me,them,embed,callback) {
			var foreignSearch, foreign = getFarSide(remote,name,type);
			if (foreign) {
				if (them) {
					models[remote].get(them,{'$b.embed':embed},callback);
				} else if (foreign) {
					foreignSearch = {};
					foreignSearch[foreign] = me[id];
					models[remote].find(foreignSearch,{'$b.embed':embed},callback);
				} else {
					callback(null,null);
				}
			} else {
				callback(null,null);
			}
		};
		patchFarSide = function (m,name,id,type,model,field,cb) {
			// now set the new ones
			var rfield = getFarSide(m,name,type);
			async.waterfall([
				function (cb) {
					getRemote(m,type,model,model[field],null,cb);
				},
				function (data,cb) {
					var rid = modules[m].id || DEFAULTID, update = {};
					update[rfield] = null;
					// data now contains all of the items that have belongs_to us
					// clear them out
					data = [].concat(data||[]);
					if (data.length > 0) {
						models[m].patch(_.map(data,rid),update,cb);
					} else {
						cb(null,null);
					}
				},
				function (res,cb) {
					// now set the new ones
					var update = {};
					if (model[field]) {
						update[rfield] = id;
						models[m].patch(model[field],update,cb);
					} else {
						cb();
					}
				}
			],cb);
		};
		patchMM = function (m,name,id,type,model,field,thru,cb) {
			// now set the new ones
			var myField = getFarSide(thru,name,"belongs_to"), farField = getFarSide(thru,m,"belongs_to"),
			rid = modules[thru].id || DEFAULTID;
			async.waterfall([
				function (cb) {
					var search = {};
					search[myField] = id;
					models[thru].find(search,cb);
				},
				function (data,cb) {
					// remove all of them
					async.each(_.map(data,rid),function (i,cb) {
						models[thru].destroy(i,cb);
					},cb);
				},
				function (cb) {
					// now set the new ones
					async.each([].concat(model[field]||[]),function (item,cb) {
						var update = {};
						update[farField] = item;
						update[myField] = id;
						models[thru].create(update,cb);
					},cb);
				}
			],cb);
		};
		
		// if any association in a creation or update is has_one,has_many,many_to_many, then make the remote updates
		setRemoteAssociations = function (model,id,mode,cb) {
			async.each(_.keys(fields),function (f,cb) {
				var type, m, assoc = (fields[f] || {}).association, thru, field;
				// only bother if it is a defined association
				if (assoc) {
					type = assoc.type;
					m = assoc.model || f;
					thru = assoc.through;
					field = getFarSide(m,name,type);
					// depends on our mode and type
					switch(mode) {
						case "create":
							// for create, we just set the remote
							if (model[f]) {
								// need to set the remote model(s)
								getRemote(m,type,model,model[f],null,function (err,data) {
									var rid = modules[m].id||DEFAULTID, update = {};
									data = [].concat(data||[]);
									if (data.length > 0) {
										async.each(data,function (item,cb) {
											if (type === "has_one" || type === "has_many") {
												update[field] = id;
												models[m].patch(item[rid],update,function (err) {
													cb();
												});
											} else if (type === "many_to_many") {
												update[getFarSide(thru,m,"belongs_to")] = item[rid];
												update[getFarSide(thru,name,"belongs_to")] = id;
												models[thru].create(update,function (err) {
													cb();
												});
											} else {
												cb();
											}
										},cb);
									} else {
										cb();
									}
								});
							} else {
								cb();
							}
							break;
						case "update":
							// if it is not set, clear all others
							// it is set, clear all others then set it
							if (type === "has_one" || type === "has_many") {
								patchFarSide(m,name,id,type,model,f,cb);
							} else if (type === "many_to_many") {
								patchMM(m,name,id,type,model,f,thru,cb);
							} else {
								cb();
							}
							break;
						case "patch":
							// if it is not set, ignore it
							// it is set, set it
							// if it is null or "", clear it
							if ((type === "has_one" || type === "has_many") && model[f] !== undefined) {
								patchFarSide(m,name,id,type,model,f,cb);
							} else if (type === "many_to_many" && model[f] !== undefined) {
								patchMM(m,name,id,type,model,f,thru,cb);
							} else {
								cb();
							}
							break;
					}
				} else {
					cb();
				}
			},cb);
		};
		
		// remove association fields of type has_one,has_many,many_to_many from list
		
		doEmbed = function (set,embed,callback) {
			if (embed) {
				// for each item in the set, go through each embed field and embed it if relevant
				async.each([].concat(set||[]),function (item,cb) {
					// these embeds need to be async
					async.each(_.keys(embed),function (key,cb) {
						var m, val = embed[key], type, thru, ids;
						if (key && fields[key] && fields[key].association) {
							m = fields[key].association.model || key;
							type = fields[key].association.type;
							thru = fields[key].association.through;
							// an association can be embedded
							switch(type) {
								case "belongs_to":
									// get the remote item
									if (models[m] && item[key]) {
										models[m].get(item[key],{'$b.embed':val},function (err,res) {
											item[key] = res;
											cb();
										});
									} else {
										cb();
									}
									break;
								case "has_one":
								case "has_many":
									// first look at the model to find out which field it is that keeps the property
									// then search for it
									getRemote(m,type,item,null,val,function (err,data) {
										if (type === "has_one" && data) {
											item[key] = [].concat(data)[0];
										} else if (type === "has_many") {
											item[key] = [].concat(data||[]);
										}
										cb();
									});
									break;
								case "many_to_many":
									// 1- find the through table
									// 2- get all of those that have the field matching us, using getBelongs
									// 3- find the remote table
									// 4- get all of those that have the correct setting
									async.waterfall([
										function (cb) {
											// must explicitly set this as belongs_to
											getRemote(thru,"belongs_to",item,null,val,cb);
										},
										function (res,cb) {
											// did we find any?
											if (res && res.length > 0) {
												// so now we have those that include us, find the other side
												ids = _.map(res,getFarSide(thru,m,"belongs_to"));
												models[m].get(ids,{'$b.embed':val},cb);
											} else {
												cb(null,null);
											}
										},
										function (res,cb) {
											item[key] = [].concat(res||[]);
											cb();
										}
									],function () {
										cb();
									});
									break;
								default:
									break;
							}
						}
						else {cb();}
					},function (err,res) {
						cb();
					});
				},function (err,res) {
					callback(err,set);
				});
			} else {
				callback(null,set);
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
		
		validate = function (items,vid,mode,callback) {
			var list;
			// was no vid supplied?
			if (!callback && typeof(mode) === "function") {
				callback = mode;
				mode = vid;
				vid = null;
			}
			if (fields) {
				// put them together, so within async.concat we can know the id, if any
				vid = [].concat(vid||[]);
				list = _.reduce([].concat(items||[]),function (result,item,i) {
					result.push({item:item,id:vid[i]});
					return result;
				},[]);
				async.concat(list,function (item,cb) {
					var attrs = item.item, vid = item.id;
					// next check that each field that is required is present, and that each field meets its validation tests
					// when do we do things differently? depends on 'mode'
					// get - EVERYTHING must be there
					// create - everything must be there except a field flagged 'createoptional' or one with a 'default' value
					// update - nothing must be there, but that which is must pass validation
					async.concat(_.keys(fields),function (key,cb) {
						var value = fields[key], ret = {}, m, type;
						if (value !== undefined) {
							// if the field is required, make sure it is there, unless we are one of:
							// - in update mode
							// - in create mode and (value.createoptional === true or value.default !== undefined)
							if (attrs[key] === undefined) {
								// do not even move to other validations if it is required and empty
								if (value.required && (mode === "get" || mode === "find" || mode === "update" || (mode === "create" && !value.createoptional))) {
									ret[key] = "required";
									cb(null,ret);
								} else {
									cb();
								}
							} else if (value.mutable === false && (mode === "update" || mode === "patch")) {
								ret[key] = "immutable";
								cb(null,ret);
							} else if (value.validation) {
								async.concat([].concat( value.validation.valid || value.validation ),function (v,c) {
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
										c(null,msg);
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
									var msg, parentname = value.validation.parent, parentvalue = null;
									// check what the parent must be
									// if it is not defined, then it must match exactly
									if (!value.validation.check) {
										parentvalue = attrs[key];
									} else if (typeof(value.validation.check) === "string") {
										parentvalue = value.validation.check.split(',').indexOf(attrs[key]) >= 0 ? attrs[key] : null;
									} else if (_.isArray(value.validation.check)) {
										parentvalue = value.validation.check.indexOf(attrs[key]) >= 0 ? attrs[key] : null;
									} else if (typeof(value.validation.check) === "object") {
										parentvalue = value.validation.check[attrs[key]] || null;
										// '*' means anything at all
										if (parentvalue === '*') {
											parentvalue = null;
										}
									}
									parentvalue = [].concat(parentvalue||[]);
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
										parentvalue.length > 0) {
										// so we have a parent to check
										// first, did we define the parent in our post/put/patch, or do we need to find out what it is?
										async.waterfall([
											function (cb) {
												if (attrs[parentname]) {
													cb(null,attrs[parentname]);
												} else if (mode === "patch"){
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
														if (err || !data || _.indexOf(parentvalue,data[key]) < 0) {
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
											cb(null,result);
										});
									} else {
										cb(null,msg);
									}
								});
							} else if (value.association && (mode === "create" || mode === "update" || mode === "patch")) {
								m = fields[key].association.model || key;
								type = value.association.type;
								switch(type){
									case "belongs_to":
										// not null: check that the remote one exists
										// null: nothing
										if (attrs[key]) {
											// get the remote item
											if (models[m]) {
												models[m].get(attrs[key],function (err,res) {
													if (err || !res || res.length < 1) {
														ret[key] = "invalid";
														cb(null,ret);
													} else {
														cb();
													}
												});
											} else {
												ret[key] = "invalid";
												cb(null,ret);
											}
										} else {
											cb();
										}
										break;
									case "has_one":
									case "has_many":
									case "many_to_many":
										// this is validation, so we only need to check that the remote side exists
										// in post-processing, we will update it
										if (attrs[key]) {
											// need to make sure remote side(s) exist(s)
											async.waterfall([
												function (cb) {
													getRemote(m,type,attrs,attrs[key],null,cb);
												},
												function (res,cb) {
													// are there ones to which it belongs?
													if (!res || [].concat(res).length <= 0) {
														ret[key] = "invalid";
														cb(ret);
													} else {
														cb();
													}
												}
											],function (err) {
												cb(null,err||null);
											});
										} else {
											cb();
										}
										break;
									default:
										cb();
										break;
								}
							} else {
								cb();
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
				
					
						cb ( null, ret );
					});
				},function (errors,verrs) {
					// is it a single item?
					var e;
					if (verrs.length === 0) {
						e = null;
					} else if (items && items.length === undefined) {
						e = verrs[0];
					} else {
						e = verrs;
					}
					callback(e,items);
				});
				
			} else {
				callback(null,items);
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
							if (key) {
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
							var conflicts = [], keyStr = String(key);
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
										if (sjs.matchObject(item,check) && String(item[id]) !== keyStr) {
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
							async.each(_.map(data,id),function (id,cb) {
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
			var policy, children, allow, field;
			config = config || {};
			policy = config.policy;
			children = config.children;
			field = config.field || name;
			allow = policy === undefined || policy === "allow" || (policy === "force" && force);
			if (!allow && children && models[children]) {
				// here is where the work is done
				// first see if we have any children
				async.waterfall([
					function (cb) {
						// first get our children
						var search = {};
						search[field] = key;
						models[children].find(search,function (err,data) {
							cb(null,data);
						});
					},
					function (childs,cb) {
						// what we do now depends on the policy
						if (childs && childs.length > 0) {
							switch (policy) {
								case "cascade":
									async.each(_.map(childs,id),function (id,cb) {
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
				var search = util.removeDollarB(parent);
				search[id] = key;
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = {};
				}
				async.waterfall([
					function (cb) {
						filters.get(key,models,cb);
					},
					function (cb) {
						db.find(table,search,cb);
					},
					function (res,cb) {
						// simplify it to a single item, if key was single
						res = res && res.length === 1 ? res[0] : res;
						// pass it through validate
						validate(res,"get",cb);
					},
					function (set,cb) {
						// do we do any embedding?
						doEmbed(set,util.extractEmbed(parent),cb);
					}
				],function (err,res) {
					pps.get(key,models,err,res,function (e) {
						callback(e||err,res);
					});
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
				fulls = _.extend({},search,converted,util.removeDollarB(parent));
				
				async.waterfall([
					function (cb) {
						filters.find(search,models,cb);
					},
					function (cb) {
						db.find(table,fulls,cb);
					},
					function (res,cb) {
						validate(res,"find",cb);
					},
					function (res,cb) {
						// do we do any embedding?
						doEmbed(res,util.extractEmbed(parent),cb);
					}
				],function (err,res) {
					pps.find(fulls,models,err,res,function (e) {
						callback(e||err,res);
					});
				});
			},
			create: function (model,parent,callback) {
				var id;
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				// set default values
				setDefaultValues(model);
				async.waterfall([
					function (cb) {
						// validate
						validate(model,"create",cb);
					},
					function (res,cb) {
						checkUnique(model,null,false,cb);
					},
					function (res,cb) {
						filters.create(model,models,cb);
					},
					function (cb) {
						doPresave(model,cb);
					},
					function (cb) {
						db.create(table,util.removeAssociations(util.removeDollarB(model),fields),cb);
					},
					function (res,cb) {
						id = res;
						setRemoteAssociations(model,res,"create",cb);
					}
				],function (err,res) {
					// need to check for unique errors and suppress them if suppressUniqueError
					err = util.removeUnique(err,suppressUniqueError);
					pps.create(model,models,err,id,function (e) {
						callback(e||err,id);
					});
				});
			},
			update: function (key,model,parent,callback) {
				var update;
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				// validate
				model = model || {};
				// initial update is model
				update = model;
				key = key === 'undefined' || key === null ? model[id] : key;
				
				
				// set default values
				setDefaultValues(model);
				
				
				async.waterfall([
					function (cb) {
						// validate
						validate(model,key,"update",function (e,items) {
							var mutreq = [];
							// did we have any errors other than validation:required for mutable:false fields?
							_.each(e||{},function (val,key) {
								if(val === "required" && (fields[key].mutable === false || key === id)) {
									mutreq.push(key);
									delete e[key];
								}
							});
							if (_.size(e) > 0) {
								cb(e,model);
							} else {
								cb(null,mutreq);
							}
						});
					},
					function (mutreq,cb) {
						if (mutreq.length > 0) {
							db.get(table,key,function (err,res) {
								if (res) {
									// only extend those fields that are in mutreq
									cb(null,_.extend({},_.pick(res,mutreq),model));
								} else {
									cb(err,model);
								}
							});
						} else {
							cb(null,model);
						}
					},
					function (res,cb) {
						model = res;
						checkUnique(model,key,false,cb);
					},
					function (res,cb) {
						// make sure we keep the same ID field
						model[id] = key;
						filters.update(key,model,models,cb);
					},
					function (cb) {
						doPresave(model,cb);
					},
					function (cb) {
						db.update(table,key,util.removeAssociations(util.removeDollarB(model),fields),cb);
					},
					function (res,cb) {
						update = res;
						setRemoteAssociations(model,key,"update",cb);
					},
					function (cb) {
						checkCascade(key,model,cb);
					}
				],function (err,res) {
					// need to check for unique errors and suppress them if suppressUniqueError
					err = util.removeUnique(err,suppressUniqueError);
					pps.update(key,model,models,err,update,function (e) {
						callback(e||err,err?null:update);
					});
				});
			},
			patch: function (key,model,parent,callback) {
				var update;
				if (callback === undefined && typeof(parent) === "function") {
					callback = parent;
					parent = null;
				}
				model = model || {};
				// initial update is model
				update = model;
				key = key === 'undefined' || key === null ? model[id] : key;


				async.waterfall([
					function (cb) {
						// validate
						validate(model,key,"patch",cb);
					},
					function (res,cb) {
						checkUnique(model,key,true,cb);
					},
					function (res,cb) {
						filters.patch(key,model,models,cb);
					},
					function (cb) {
						doPresave(model,cb);
					},
					function (cb) {
						db.patch(table,key,util.removeAssociations(util.removeDollarB(model),fields),cb);
					},
					function (res,cb) {
						update = res;
						setRemoteAssociations(model,key,"patch",cb);
					},
					function (cb) {
						checkCascade(key,model,cb);
					}
				],function (err,res) {
					// need to check for unique errors and suppress them if suppressUniqueError
					err = util.removeUnique(err,suppressUniqueError);
					pps.patch(key,model,models,err,update,function (e) {
						callback(e||err,err?null:update);
					});
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
				
				async.waterfall([
					function (cb) {
						// check if there are delete policies on the model
						checkDelete(key,parent,module.delete,force,cb);
					},
					function (cb) {
						filters.destroy(key,models,cb);
					},
					function (cb) {
						if (module.delete && module.delete.prevent === true) {
							cb(null,key);
						} else {
							db.destroy(table,key,cb);
						}
					}
				],function (err,res) {
					pps.destroy(key,models,err,res,function (e) {
						callback(e||err,res);
					});
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
