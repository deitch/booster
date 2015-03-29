/*jslint node:true */
var filter = function (model,data,visible) {
	switch(visible) {
		case "private":
			data = model.filter(data,"private");
			break;
		case "secret":
			data = model.filter(data,"secret");
			break;
		case "public":
			data = model.filter(data,"public");
			break;
		default:
			data = model.filter(data,"public");
			break;
	}
	return(data);
};

module.exports = {
	index: function (req,res,next) {
		var User = req.booster.models.user;
		User.find({},function (err,data) {
			if (err) {
				res.status(400).send(err);
			} else {
				res.send(filter(User,data,req.param("visibility")));
			}
		});
	},
	show: function (req,res,next) {
		var User = req.booster.models.user;
		User.get(req.param("user"),function (err,data) {
			if (err) {
				res.status(400).send(err);
			} else {
				res.send(filter(User,data,req.param("visibility")));
			}
		});
	}
};