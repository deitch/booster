/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		text: {},
		deleteparentcascade_childcascade: {}
	},
	delete: {children:"deletegrandchild",policy:"cascade"}
};