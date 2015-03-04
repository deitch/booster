/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		name: {required:true},
		assoc: {association:{model:"assocparent",type:"belongs_to"}},
		hasone: {association:{model:"assoconechild",type:"hasone"}},
		hasmany: {association:{model:"assocmanychild",type:"hasone"}}
	}
};