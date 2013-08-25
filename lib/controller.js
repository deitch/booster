/*jslint node:true, nomen:true */

var _ = require('lodash'), parseSearch, isUniqueIssue;


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
		if (_.contains(e||{},"notunique")) {
			issue = true;
			return(false);
		}
	});
	return(issue);
};

module.exports = {
	generate : function (name,ext,parent) {
		var ctrlr = {}, baseCtrlr = {
			before: function (req,res,next) {
				var p = {}, pid = req.param(parent);
				if (pid) {
					p[parent] = pid;
				}
				req.booster.parent = p;
				next();
			},
			index: function(req,res,next) {
				var m = req.booster.models[name], filter = req.param("_csview") || "public";
				// we do NOT allow filter "secret"
				if (filter === "secret") {
					res.send(400);
				} else {
					m.find({},req.booster.parent,function (err,data) {
						if (err) {
							res.send(400,err);
						} else {
							res.send(200,m.filter(data,filter));
						}
					});
				}
			},
			show: function(req,res,next) {
				var m = req.booster.models[name], filter = req.param("_csview") || "public", keys = req.param(name).split(",");
				// we do NOT allow filter "secret"
				if (filter === "secret") {
					res.send(400);
				} else {
					m.get(keys.length > 1 ? keys : keys[0],req.booster.parent,function (err,data) {
						if (err) {
							res.send(400,err);
						} else if (!data || data.length < 1) {
							res.send(404);
						} else {
							res.send(200,m.filter(data,filter));
						}
					});
				}
			},
			create: function(req,res,next) {
		    var me = function() {
					req.booster.models[name].create(req.body,req.booster.parent,function(err,data){
						if (err) {
							// check for conflict vs other error
							res.send(isUniqueIssue(err)?409:400,err);
						} else if (!data) {
							res.send(400,null);
						} else {
							res.send(201,data);
						}
					});
		    };

		    if ( req.body === undefined ) {
		        require('express').bodyParser()( req, res, me );
		    } else {
		        me();
		    }
			},
			update: function(req,res,next) {
				var me = function () {
					req.booster.models[name].update(req.param(name),req.body,req.booster.parent,function(err,data){
						if (err) {
							// check for conflict vs other error
							res.send(isUniqueIssue(err)?409:400,err);
						} else if (!data) {
							res.send(404);
						} else {
							res.send(200,data);
						}
					});
				};
		    if ( req.body === undefined ) {
		        require('express').bodyParser()( req, res, me );
		    } else {
		        me();
		    }
			},
			patch: function(req,res,next) {
				var me = function () {
					req.booster.models[name].patch(req.param(name),req.body,req.booster.parent,function(err,data){
						if (err) {
							// check for conflict vs other error
							res.send(isUniqueIssue(err)?409:400,err);
						} else if (!data) {
							res.send(404);
						} else {
							res.send(200,data);
						}
					});
				};
		    if ( req.body === undefined ) {
		        require('express').bodyParser()( req, res, me );
		    } else {
		        me();
		    }
			},
			getProperty: function (req,res,next) {
				var m = req.booster.models[name], filter = req.param("_csview") || "public", property = req.param("prop123var");
				// we do NOT allow filter "secret"
				if (filter === "secret") {
					res.send(400);
				} else {
					m.get(req.param(name),req.booster.parent,function (err,data) {
						if (err) {
							res.send(400,err);
						} else if (!data || data.length < 1) {
							next();
						} else {
							data = m.filter(data,filter);
							if (data[property] !== undefined) {
								res.send(200,data[property]);
							} else {
								next();
							}
						}
					});
				}
			},
			setProperty: function (req,res,next) {
				var me = function () {
					var data = {}, property = req.param("prop123var");
					data[property] = req.text || req.body;
					req.booster.models[name].patch(req.param(name),data,req.booster.parent,function(err,data){
						if (err) {
							// check for unknownfield vs other error
							if(err[property] === "unknownfield") {
								next();
							} else if (err[property] === "notunique") {
								res.send(409,err);
							} else {
								res.send(400,err);
							}
						} else if (!data) {
							res.send(404);
						} else {
							res.send(200,data);
						}
					});
				};
		    if ( req.body === undefined ) {
		        require('express').bodyParser()( req, res, me );
		    } else {
		        me();
		    }
			},
			destroy: function(req,res,next) {
				req.booster.models[name].destroy(req.param(name),req.booster.parent,function(err,data){
					if (err) {
						next(err);
					} else if (!data) {
						res.send(404);
					} else {
						res.send(200,data);
					}
				});
			}	
		};
		// now we need to go through the extends, and see if there is anything overriden or deleted
		// _.extend does this wonderfully, and even can handle ext being null
		_.extend(ctrlr,baseCtrlr,ext);
		return(ctrlr);
	}
};
