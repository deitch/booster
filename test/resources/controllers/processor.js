/*jslint node:true,nomen:true */
var _ = require('lodash');

module.exports = {
	post: {
		all: function (req,res,next,status,body) {
			var pr = res.get("processor"), d = pr ? [pr].concat("all") : "all", p = req.param("ptype");
			if (p === "both" || p === "all") {
				res.set("processor",typeof(d) === "string" ? d : JSON.stringify(d));
			}
			next();
		},
		create: function (req,res,next,status,body) {
			var pr = res.get("processor"), d = pr ? [pr].concat("create") : "create", p = req.param("ptype");
			if (p === "both" || p === "create") {
				res.set("processor",typeof(d) === "string" ? d : JSON.stringify(d));
			}
			next();
		},
		update: function (req,res,next,status,body) {
			res.send(400,"changed");
		}
	}
};