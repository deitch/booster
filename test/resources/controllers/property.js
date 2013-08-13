/*jslint node:true */

var groups = ["1","2"], roles = ["A","B"];

module.exports = {
	properties: {
		groups: {
			get: function(req,res,next) {
				res.send(200,groups);
			},
			set: function(req,res,next) {
				groups = req.body;
				res.send(200);
			}
		},
		roles: {
			get: function(req,res,next) {
				res.send(roles);
			}
		},
		strange: {
			set: function(req,res,next) {
				res.send(200);
			}
		}		
	}
};