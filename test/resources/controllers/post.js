/*jslint node:true */

module.exports = {
	index: null,
	update: function (req,res,next) {
		res.send("You asked to update "+req.params.post);
	}
};