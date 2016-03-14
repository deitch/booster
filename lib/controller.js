/*jslint node:true, nomen:true, unused:vars */

var _ = require('lodash'), bodyParser = require('body-parser'), util = require('./util'),
parseSearch, isUniqueIssue, isSendObject, matchEmbed, CSVIEW = '$b.csview';


// regular expression
/*jslint regexp:true */
var QUERYRE = /^search\.(.+)$/;
/*jslint regexp:false */

parseSearch = function(params) {
	var ret = {}, match;
	if (params) {
		_.each(params,function(val,key){
			// HERE IS THE PROBLEM: IS THIS A QUERY?
			match = QUERYRE.exec(key);
			if (match) {
				ret[match[1]] = val;
			}
		});
	}
	return(ret);
};

isUniqueIssue = function (err) {
	var issue = false;
	_.each(err||[],function (e) {
		if (_.includes(e||{},"notunique")) {
			issue = true;
			return(false);
		}
	});
	return(issue);
};

isSendObject = function (init,req) {
	var header = req.headers["x-booster-sendobject"], param = req.query.sendObject, ret = false;
	if (param === true || param === "true") {
		ret = true;
	} else if (param === false || param === "false") {
		ret = false;
	} else if (header === true || header === "true") {
		ret = true;
	} else if (header === false || header === "false") {
		ret = false;
	} else {
		ret = init;
	}
	return(ret);
};

matchEmbed = function (query,allowed) {
	var ret = true;
	if (typeof(query) === "string") {
		query = (query||"").split(",");
	}
	query = query.sort();
	if (allowed === true) {
		ret = true;
	} else {
		_.each(query,function (field) {
			if (!allowed[field]) {
				ret = false;
				return ret;
			}
		});
	}
	return ret;
};

module.exports = {
	generate : function (name,pathName,ext,opts,sendObjectInit) {
		var ctrlr = {}, parent, parentProperty, parentDefault, checkParentProperty, baseCtrlr, allowedEmbed;
		opts = opts || {};
		parent = opts.parent; parentProperty = opts.parentProperty; parentDefault = opts.parentDefault;
		allowedEmbed = opts.embed === true ? opts.embed : _.keyBy(opts.embed||[]);
		checkParentProperty = function (req,mode) {
			var ret = true;
			req.body = req.body || {};
			// logic:
			// - if it exists && matches: PASS
			// - if it exists && conflicts: FAIL
			// - if it does not exist && parentDefault && "create": PASS (and set it)
			// - if it does not exist && "patch": PASS
			// - if it does not exist && "update" && parentDefault && model.mutable(): PASS and set it
			// - if it does not exist && "update" && parentDefault && !model.mutable(): PASS and do not set it
			// - if it does not exist && "update" && !parentDefault: FAIL
			if (parent && parentProperty) {
				// if it exists, just check for match or no match
				if (req.body[parent]) {
					ret = req.body[parent] === req.params[parent];
				} else {
					switch (mode) {
						case "create":
							// POST can always create it, if allowed
							if (parentDefault) {
								req.body[parent] = req.params[parent];
								ret = true;
							} else {
								ret = false;
							}
							break;
						case "update":
							// 3 possibilities:
							// 1) no parent default: FAIL
							// 2) parent default and mutable: PASS (and set it)
							// 3) parent default and immutable: PASS (no set)
							// PUT can only do it if it is mutable, else leave it alone
							if (!parentDefault) {
								ret = false;
							} else if (req.booster.models[name].mutable(parent)) {
								req.body[parent] = req.params[parent];
								ret = true;
							} else {
								ret = true;
							}
							break;
						case "patch":
							// PATCH never makes it required or adds it
							ret = true;
							break;
					}
				}
			} else {
				// without a parent && parentProperty, we definitely go ahead
				ret = true;
			}
			return(ret);
		};
		baseCtrlr = {
			all: function (req,res,next) {
				var p = {}, pid = req.params[parent], embed = req.query['$b.embed'];
				if (pid) {
					pid = pid.split(",");
					p[parent] = pid.length > 1 ? pid : pid[0];
				}
				// also add the embed here
				if (embed) {
					if (allowedEmbed === true || matchEmbed(embed,allowedEmbed)) {
						p['$b.embed'] = embed;
						req.booster.parent = p;
						next();
					} else {
						res.status(403).send({embed:"invalid"});
					}
				} else {
					req.booster.parent = p;
					next();
				}
			},
			index: function(req,res,next) {
				var m = req.booster.models[name], filter = req.query[CSVIEW] || "public", search = util.removeDollarB(req.query);
				// we do NOT allow filter "secret"
				if (filter === "secret") {
					res.status(400).end();
				} else {
					m.find(search,req.booster.parent,function (err,data) {
						if (err) {
							res.status(400).send(err);
						} else {
							// should always return an array
							res.status(200).send(m.filter(data||[],filter));
						}
					});
				}
			},
			show: function(req,res,next) {
				var m = req.booster.models[name], filter = req.query[CSVIEW] || "public", keys = req.params[pathName].split(",");
				// we do NOT allow filter "secret"
				if (filter === "secret") {
					res.status(400).end();
				} else {
					m.get(keys.length > 1 ? keys : keys[0],req.booster.parent,function (err,data) {
						if (err) {
							res.status(400).send(err);
						} else if (!data || data.length < 1) {
							res.status(404).end();
						} else {
							// if we just asked for /resource/1 then send back a single item, not an array
							if (keys.length === 1 && data.length === 1) {
								data = data[0];
							}
							res.status(200).send(m.filter(data,filter));
						}
					});
				}
			},
			create: function(req,res,next) {
		    var me = function() {
					// need to make sure that we have the parentProperty if needed
					if (!checkParentProperty(req,"create")) {
						res.status(400).send("missingparentproperty");
					} else {
						req.booster.models[name].create(req.body,req.booster.parent,function(err,data){
							if (err) {
								// check for conflict vs other error
								res.status(isUniqueIssue(err)?409:400).send(err);
							} else {
								res.status(201).send(data);
							}
						});
					}
		    };

		    if ( req.body === undefined ) {
		        bodyParser.json()( req, res, me );
		    } else {
		        me();
		    }
			},
			update: function(req,res,next) {
				var that = this, me = function () {
					var key = req.params[pathName];
					if (!checkParentProperty(req,"update")) {
						res.status(400).send("missingparentproperty");
					} else {
						req.booster.models[name].update(key,req.body,req.booster.parent,function(err,data){
							if (err) {
								// check for conflict vs other error
								res.status(isUniqueIssue(err)?409:400).send(err);
							} else if (!data) {
								res.status(404).end();
							} else if (isSendObject(sendObjectInit,req)) {
								that.show(req,res,next);
							} else {
								res.status(200).send(key);
							}
						});
					}
				};
		    if ( req.body === undefined ) {
	        bodyParser.json()( req, res, me );
		    } else {
		        me();
		    }
			},
			patch: function(req,res,next) {
				var that = this, me = function () {
					var key = req.params[pathName];
					if (!checkParentProperty(req,"patch")) {
						res.status(400).send("missingparentproperty");
					} else {
						req.booster.models[name].patch(key,req.body,req.booster.parent,function(err,data){
							if (err) {
								// check for conflict vs other error
								res.status(isUniqueIssue(err)?409:400).send(err);
							} else if (!data) {
								res.status(404).end();
							} else if (isSendObject(sendObjectInit,req)) {
								that.show(req,res,next);
							} else {
								res.status(200).send(key);
							}
						});
					}
				};
		    if ( req.body === undefined ) {
	        bodyParser.json()( req, res, me );
		    } else {
		        me();
		    }
			},
			getProperty: function (req,res,next) {
				var m = req.booster.models[name], children = req.booster.children[name], 
				filter = req.query[CSVIEW] || "public", property = req.params.prop123var;
				// it is possible that our resource was registered with a child resource (using {parent"us"} in the child definition
				//   or resource-as-a property)
				// if so, we must not return the property; it should override
				if (children && children[property]) {
					next();
				} else if (filter === "secret") {
					// we do NOT allow filter "secret"
					res.status(400).end();
				} else {
					m.get(req.params[pathName],req.booster.parent,function (err,data) {
						if (err) {
							res.status(400).send(err);
						} else if (!data || data.length < 1) {
							next();
						} else {
							data = m.filter(data,filter);
							if (data[property] !== undefined) {
								res.status(200).send(data[property]);
							} else {
								next();
							}
						}
					});
				}
			},
			setProperty: function (req,res,next) {
				var me = function () {
					var data = {}, property = req.params.prop123var;
					data[property] = req.text || req.body;
					req.booster.models[name].patch(req.params[pathName],data,req.booster.parent,function(err,data){
						if (err) {
							// check for unknownfield vs other error
							if(err[property] === "unknownfield") {
								next();
							} else if (err[property] === "notunique") {
								res.status(409).send(err);
							} else {
								res.status(400).send(err);
							}
						} else if (!data) {
							res.status(404).end();
						} else {
							res.status(200).send(data);
						}
					});
				};
		    if ( req.body === undefined ) {
	        bodyParser.json()( req, res, me );
		    } else {
		        me();
		    }
			},
			destroy: function(req,res,next) {
				req.booster.models[name].destroy(req.params[pathName],req.booster.parent,req.query.force === "true",function(err,data){
					if (err) {
						res.status(err.delete === "children" ? 409 : 400).send(err);
					} else if (!data) {
						res.status(404).end();
					} else {
						res.status(204).end();
					}
				});
			}	
		};
		// now we need to go through the extends, and see if there is anything overriden or deleted
		// _.extend does this wonderfully, and even can handle ext being null
		_.extend(ctrlr,baseCtrlr,ext);
		// now process the 'except' and 'only' rules. First do 'only', and if it does not exist, then do 'except'
		// now just remove any of the ones that are in an exception list
		if (opts.only) {
			ctrlr = _.pick(ctrlr,[].concat(opts.only,"all","post","filter"));
		} else if (opts.except) {
			ctrlr = _.omit(ctrlr,[].concat(opts.except));
		}
		return(ctrlr);
	}
};
