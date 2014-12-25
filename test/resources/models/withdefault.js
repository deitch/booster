/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		title: {required:true,default:"default title"},
		other: {required:true,default:"default other"},
		content: {required:false,default:"default content"}
	}
};