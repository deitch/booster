/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		singlevalue: {required:false,cascade:{value:"published",children:"cascadethree"}},
		arrayvalue: {required:false,cascade:{value:"published",children:"cascadethree"}},
		anyvalue: {required:false,cascade:{children:"cascadethree"}},
		multiplechildren: {required:false},
		cascadeone: {required:false}
	}
};