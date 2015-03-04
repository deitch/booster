/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		name: {required:true},
		assoc: {association:{model:"assocparent",type:"belongs_to"}},
		assoc_other: {association:{model:"assocother",type:"belongs_to"}}
	}
};