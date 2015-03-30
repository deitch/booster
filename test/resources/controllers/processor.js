/*jslint node:true,nomen:true, unused:vars */

module.exports = {
	post: {
		all: function (req,res,next,body) {
			var pr = res.get("processor"), d = pr ? [pr].concat("all") : "all", p = req.query.ptype;
			if (p === "both" || p === "all") {
				res.set("processor",typeof(d) === "string" ? d : JSON.stringify(d));
			}
			next();
		},
		index: function (req,res,next,body) {
			var pr = res.get("processor"), d = pr ? [pr].concat("index") : "index", p = req.query.ptype;
			if (p === "index") {
				res.set("processor",typeof(d) === "string" ? d : JSON.stringify(d));
			}
			next();
		},
		create: function (req,res,next,body) {
			var pr = res.get("processor"), d = pr ? [pr].concat("create") : "create", p = req.query.ptype;
			if (p === "both" || p === "create") {
				res.set("processor",typeof(d) === "string" ? d : JSON.stringify(d));
			}
			next();
		},
		update: function (req,res,next,body) {
			res.status(400).send("changed");
		}
	}
};