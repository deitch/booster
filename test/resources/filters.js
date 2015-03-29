/*jslint node:true */

module.exports = {
	all: function (req,res,next) {
		var p = req.query["system.all"];
		if (p) {
			res.status(403).send(p);
		} else {
			next();
		}
	},
	filter: {
		all: function (req,res,next) {
			var p = req.query["system.filter.all"];
			if (p) {
				res.status(403).send(p);
			} else {
				next();
			}
		},
		show: function (req,res,next) {
			var p = req.query["system.filter.show"];
			if (p) {
				res.status(403).send(p);
			} else {
				next();
			}
		}
	}
};