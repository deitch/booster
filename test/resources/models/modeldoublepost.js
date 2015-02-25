/*jslint node:true, unused:vars */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		title: {required:true},
		content: {required:false},
		comment: {required:false}
	},
	post: {
		create: function (model,models,err,result,callback) {
			models.post.create({title:"New Title"},function (err,res) {
				models.called = result;
				callback();
			});
		}
	}
};