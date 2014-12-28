/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		text: {},
		deleteparentcascade_childprevent: {}
	},
	delete: {children:"deletegrandchild",policy:"prevent"}
};