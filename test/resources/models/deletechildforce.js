/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		text: {},
		deleteparentcascade_childforce: {}
	},
	delete: {children:"deletegrandchild",policy:"force"}
};