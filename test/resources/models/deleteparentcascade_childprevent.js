/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		text: {}
	},
	delete: {children:"deletechildprevent",policy:"cascade"}
};