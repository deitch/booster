/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		singlevalue: {required:false,cascade:{value:"published",children:"cascadetwo"}},
		arrayvalue: {required:false,cascade:{value:["published","pending"],children:"cascadetwo"}},
		anyvalue: {required:false,cascade:{children:"cascadetwo"}},
		multiplechildren: {required:false,cascade:{value:"published",children:["cascadetwo","cascadefour","cascadefilter"]}},
		nochildren: {required:false,cascade:{value:"published"}},
		errorchildren: {required:false,cascade:{value:"published",children:"weirdunusedname"}}
	}
};