/*jslint node:true, nomen:true, plusplus:true, unused:vars */

var _ = require('lodash');




module.exports = {
	removeDollarB : function (item) {
		// need a clean model without $b fields
		return _.omit(item,function (val,key) {
			return(key.indexOf('$b.') === 0);
		});
	},
	extractEmbed : function (term) {
		var ret = null, val = (term||{})["$b.embed"], t = typeof(val);
		if (val) {
			ret = (t === "string") ? val.split(",") : val;
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
		return ret;
	}
};
