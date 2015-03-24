/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		text:{},
		cancelled:{required:false,type:"boolean"}
	},
	delete: {prevent:true},
	filter: {
		destroy: function (key,models,callback) {
			models.filtercalled = key;
			models.deletepreventself.patch(key,{cancelled:true},function () {
				callback();
			});
		}
	},
	post: {
		destroy: function (key,models,err,result,callback) {
			models.postcalled = key;
			callback();
		}
	}
};