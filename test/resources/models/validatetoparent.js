/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		validateparent:{required:true},
		status: {validation: {valid:"list:draft,published",parent:"validateparent"}},
		statuscheck: {validation: {valid:"list:draft,published",parent:"validateparent",check:"published"}},
		statuscheckcomma: {validation: {valid:"list:draft,published",parent:"validateparent",check:"draft,published"}},
		statuschecklist: {validation: {valid:"list:draft,published",parent:"validateparent",check:["draft","published"]}}
	}
};