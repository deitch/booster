/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		side1: {association:{model:"assocparent",type:"belongs_to"}},
		side2: {association:{model:"assocmmchild",type:"belongs_to"}}
	}
};