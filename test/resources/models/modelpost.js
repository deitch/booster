/*jslint node:true, unused:vars */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		title: {required:true},
		content: {required:false},
		comment: {required:false}
	},
	post: {
		get: function(key,models,err,result,callback) {
			if (result) {
				result.comment = "ADDED";
			}
			callback();
		},
		find: function (search,models,err,result,callback) {
			if (result && result.length > 0) {
				result[0].comment = "ADDED";
			}
			callback();
		},
		update: function (key,model,models,err,result,callback) {
			models.called = result;
			callback();
		},
		patch: function (key,model,models,err,result,callback) {
			models.called = result;
			callback();
		},
		create: function (model,models,err,result,callback) {
			models.called = result;
			callback();
		},
		destroy: function (key,models,err,result,callback) {
			models.called = key;
			callback();
		}
	}
};