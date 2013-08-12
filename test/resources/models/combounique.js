/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true},
		firstname: {},
		lastname: {}
	}, unique: [["firstname","lastname"]]
};