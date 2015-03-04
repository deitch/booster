/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		name: {required:true},
		hasone: {association:{model:"assoconechild",type:"has_one"}},
		hasother: {association:{model:"assocother",type:"has_one"}},
		hasmany: {association:{model:"assocmanychild",type:"has_many"}},
		manytomany: {association:{model:"assocmmchild",type:"many_to_many",through:"assocjoin"}}
	}
};