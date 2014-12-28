/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		validateparent:{required:false},
		status: {validation: {valid:"list:draft,published,foo",parent:"validateparent"}},
		statuscheck: {validation: {valid:"list:draft,published,foo",parent:"validateparent",check:"published"}},
		statuscheckcomma: {validation: {valid:"list:draft,published,foo",parent:"validateparent",check:"draft,published"}},
		statuschecklist: {validation: {valid:"list:draft,published,foo",parent:"validateparent",check:["draft","published"]}}
	}
};