/*jslint node:true */

module.exports = {
	all: function (req,res,next) {
		var p = req.param("all");
		if (p) {
			res.send(403,p);
		} else {
			next();
		}
	},
	filter: {
		all: function (req,res,next) {
			var p = req.param("filter.all");
			if (p) {
				res.send(403,p);
			} else {
				next();
			}
		},
		show: function (req,res,next) {
			var p = req.param("filter.show");
			if (p) {
				res.send(403,p);
			} else {
				next();
			}
		}
	}
};