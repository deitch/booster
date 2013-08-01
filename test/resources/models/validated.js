/*jslint node:true */
module.exports = {
	fields: {
		id: {required:true,createoptional:true},
		email: {validation:["email"]},
		alpha: {validation: "alphanumeric"},
		abc: {validation: function (name,field,mode,attrs) {
			return (attrs[field] === "abc");
		}},
		def: {validation: function (name,field,mode,attrs) {
			var ret = {};
			if (mode === "get" || mode === "find") {
				ret = true;
			} else if (attrs[field] === "def") {
				ret.valid = true;
				ret.value = "fed";
			} else {
				ret.valid = false;
				ret.message = "not def";
			}
			return(ret);
		}}
	}
};