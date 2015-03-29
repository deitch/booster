/*jslint node:true */

module.exports = {
	all: function (req,res,next) {
		var p = req.query.all;
		if (p) {
			res.status(403).send(p);
		} else {
			next();
		}
	},
	filter: {
		all: function (req,res,next) {
			var p = req.query["filter.all"];
			if (p) {
				res.status(403).send(p);
			} else {
				next();
			}
		},
		show: function (req,res,next) {
			var p = req.query["filter.show"];
			if (p) {
				res.status(403).send(p);
			} else {
				next();
			}
		},
		index: function (req,res,next) {
			var p = req.query["filter.index"];
			if (p) {
				res.status(403).send(p);
			} else {
				next();
			}
		}
	}
};