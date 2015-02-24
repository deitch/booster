/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		title: {required:true},
		content: {required:false},
		comment: {required:false}
	},
	filter: {
		get: function(key,models,callback) {
			if (key === "BAD") {
				callback("error");
			} else {
				callback();
			}
		},
		find: function (search,models,callback) {
			if (search && search.title === "BAD") {
				callback("error");
			} else {
				callback();
			}
		},
		update: function (key,model,models,callback) {
			if (model.title === "BAD") {
				callback("error");
			} else {
				callback();
			}
		},
		patch: function (key,model,models,callback) {
			if (model.title === "BAD") {
				callback("error");
			} else {
				callback();
			}
		},
		create: function (model,models,callback) {
			if (model && model.title === "BAD") {
				callback("error");
			} else {
				callback();
			}
		},
		destroy: function (key,models,callback) {
			if (key === "BAD") {
				callback("error");
			} else {
				callback();
			}
		}
	}
};