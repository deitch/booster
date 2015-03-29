/*jslint node:true */

var groups = ["1","2"], roles = ["A","B"];

module.exports = {
	properties: {
		groups: {
			get: function(req,res,next) {
				res.status(200).send(groups);
			},
			set: function(req,res,next) {
				groups = req.body;
				res.status(200).end();
			}
		},
		roles: {
			get: function(req,res,next) {
				res.status(200).send(roles);
			}
		},
		strange: {
			set: function(req,res,next) {
				res.status(200).end();
			}
		}		
	}
};