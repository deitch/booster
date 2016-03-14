/*jslint node:true, nomen:true, plusplus:true, unused:vars */

var _ = require('lodash'),

reject = {
	has_one:true,
	has_many:true,
	many_to_many:true
};




module.exports = {
	removeDollarB : function (item) {
		// need a clean model without $b fields
		return _.omitBy(item,function (val,key) {
			return(key.indexOf('$b.') === 0);
		});
	},
	removeAssociations : function (item,fields) {
		// need a clean model without $b fields
		return _.omitBy(item,function (val,key) {
			return (fields && fields[key] && fields[key].association && reject[fields[key].association.type]);
		});
	},
	removeUnique : function (errs,suppress) {
		errs = suppress ? _.omitBy(errs,function (val,key) {
			return val === "notunique" && suppress;
		}) : errs;
		errs = _.size(errs) === 0 ? null : errs;
		return(errs);
	},
	extractEmbed : function (term) {
		var ret = null, val = (term||{})["$b.embed"], t = typeof(val);
		if (val) {
			// this can be a string, an array of an object 
			// If it is an object, we just return it as is
			ret = (t === "string") ? val.split(",") : val;
			if (val.length > 0 && typeof(val[0]) === "string") {
				// now turn the deep embeds into an object
				ret = _.reduce(ret,function (result,e) {
					var splitter = (e||"").split('.'), i, tmp;
					// if it has no period in it, use it as is
					switch(splitter.length) {
						case 0:
							// do nothing
							break;
						case 1:
							if (splitter[0] !== "") {
								result[splitter[0]] = result[splitter[0]] || {};
							}
							break;
						default:
							// rotate through it
							tmp = result;
							for(i=0;i<splitter.length;i++) {
								tmp[splitter[i]] = tmp[splitter[i]] || {};
								tmp = tmp[splitter[i]];
							}
							break;
					}
					return result;
				},{});
			}
		}
		return ret;
	}
};
