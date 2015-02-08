/*jslint node:true,nomen:true, plusplus:true, unused:vars */
/*global exports */
// given a value and a validation rule, make sure the value passes
/*jslint regexp:true */
var emailPattern = /^[a-zA-Z0-9._\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,4}$/, argPattern = /^([^:]+):?(.*)$/,
_ = require('lodash'), isIntegers, isStrings;
/*jslint regexp:false */

isIntegers = function(ary) {
	var valid = true, i;
	if (!_.isArray(ary)) {
		valid = false;
	} else {
		for (i=0;i<ary.length;i++) {
			// if it is not a number, set valid as false and stop processing
			if (!_.isString(ary[i]) || isNaN(ary[i])) {
				valid = false;
				break;
			}
		}
	}
	return(valid);
};
isStrings = function(ary) {
	var valid = true, i;
	if (!_.isArray(ary)) {
		valid = false;
	} else {
		for (i=0;i<ary.length;i++) {
			// if it is not a number, set valid as false and stop processing
			if (!_.isString(ary[i])) {
				valid = false;
				break;
			}
		}
	}
	return(valid);
};


exports.validate = function(value,validation) {
	var test, p;
	p = validation.match(argPattern);
	if (p && p.length > 1) {
		switch(p[1]) {
			/*
			case "match":
				test = function(val) {
					var ret = true;
					if (single === null || single === undefined) {
						single = val;
					} else if (val !== single) {
						// did not match, so indicate invalid
						ret = false;
					}
					return(ret);
				};
				break;
				*/
			case "notblank":
				test = function(val) {
					return(val !== null && val !== undefined && (typeof(val) !== "string" || val.trim() !== ""));
				};
				break;
			case "pattern":
				test = function(val) {
					return(p[2].test(val));
				};
				break;
			case "notpattern":
				test = function(val) {
					return(!p[2].test(val));
				};
				break;
			case "notpadded":
				// no whitespace on either end
				test = function(val) {
					return((/^\S+/.test(val)) && (/^\S+$/.test(val)));
				};
				break;
			case "email":
				test = function(val) {
					return(emailPattern.test(val));
				};
				break;
			case "minimum":
				test = function(val) {
					var l = parseInt(p[2],10);
					return(l === 0 || (val && val.length >= l));
				};
				break;
			case "list":
				test = function(val) {
					var l = (p[2]||"").split(",");
					return(l && l.indexOf(val) >= 0);
				};
				break;
			case "integer":
			case "number":
			case "float":
			case "double":
			  // we want not only to test it is an integer, but force it to an integer just in case; we will be more forgiving
			  test = function(val) {
			    return(val === undefined || (!isNaN(val) && typeof(val) === "number"));
			  };
			  break;
			case "alphanumeric":
			  test = function(val) {
			    return(/^[a-zA-Z0-9]*$/.test(val));
			  };
			  break;
			case "array":
        test = function(val) {
          return(val === undefined || _.isArray(val));
        };
        break;
			case "stringArray":
        test = function(val) {
          return(val === undefined || isStrings(val));
        };
        break;
			case "integerArray":
        test = function(val) {
          return(val === undefined || isIntegers(val));
        };
        break;
      case "unique":
        test = function(val) {
          return(val === undefined || (_.uniq(val).length === val.length));
        };
        break;
      case "string":
        test = function(val) {
          return(val === undefined || typeof(val) === "string");
        };
        break;
      case "boolean":
        test = function(val) {
          return(val === undefined || typeof(val) === "boolean");
        };
        break;
			default:
				test = function(val) {
					return(true);
				};
				break;
		}
	}
	return(test(value));
};
