/*jslint node:true */

module.exports = {
	index: null,
	update: function (req,res,next) {
		res.send(200,"You asked to update "+req.param("post"));
	}
};