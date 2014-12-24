/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		title: {required:true},
		content: {required:false},
		filter: {required:false,filter:{default:"yes",clear:"*"}}
	}
};