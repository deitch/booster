/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		name: {required:true},
		assoc: {association:{model:"assocparent",type:"many_to_many",through:"assocjoin"}},
		hasone: {association:{model:"assoconechild",type:"has_one"}}
	}
};