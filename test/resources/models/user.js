/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true},
		name: {required:true},
		email: {required:false,visible:"private"},
		password: {required:false,visible:"secret"}
	}
};