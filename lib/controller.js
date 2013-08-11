/*jslint node:true, nomen:true */

var _ = require('lodash'), parseSearch;


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
				req.booster.models[name].find({},req.booster.parent,function (err,data) {
					if (err) {
						res.send(400,err);
					} else {
						res.send(200,data);
					}
				});
			},
			show: function(req,res,next) {
				req.booster.models[name].get(req.param(name),req.booster.parent,function (err,data) {
					if (err) {
						res.send(400,err);
					} else if (!data || data.length < 1) {
						res.send(404);
					} else {
						res.send(200,data);
					}
				});
			},
			create: function(req,res,next) {

		    var me = function() {
					req.booster.models[name].create(req.body,req.booster.parent,function(err,data){
						if (err) {
							res.send(400,err);
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
							res.send(400,err);
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
							res.send(400,err);
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
