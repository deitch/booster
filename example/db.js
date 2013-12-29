/*jslint node:true, nomen:true */
var _ = require('lodash'), sjs = require('searchjs'), DATA = {
	post: [
	  {id:"1",title:"foo",content:"Lots of it"},
	  {id:"2",title:"foobar",content:"Even more"},
	  {id:"3",title:"bar",content:"phd"},
	  {id:"4",title:"bar",content:"phd",other:"other field"}
	],
	comment: [
		{id:"1",post:"1",comment:"First comment on 1st post"},
		{id:"2",post:"1",comment:"Second comment on 1st post"},
		{id:"3",post:"3",comment:"First comment on 3rd post"}
	]
}, IDFIELDS = {
	different: "key"
},data, findById = function (name,id) {
	var idField = IDFIELDS[name] || "id";
	return _.findIndex(data[name]||[],function (val) {
		return(val && val[idField] === id);
	});
}, reset = function () {
	data = _.cloneDeep(DATA);
};

reset();



module.exports = {
	get: function (name,key,callback) {
		var d = [], ret;
		// might have an array of keys
		_.each([].concat(key),function (k) {
			d.push(data[name][findById(name,k)]);
		});
		switch(d.length) {
			case 0:
				ret = null;
				break;
			case 1:
				ret = d[0];
				break;
			default:
				ret = d;
				break;
		}
		callback(null,ret);
		return(this);
		
	},
	find: function (name,search,callback) {
		callback(null,sjs.matchArray(data[name],search));
		return(this);
	},
	update: function (name,key,model,callback) {
		var idx = findById(name,key), tmp;
		if (idx >= 0) {
			tmp = data[name][idx];
			data[name][idx] = model;
			callback(null,key);
		} else {
			callback(null,null);
		}
		return(this);
	},
	patch: function (name,key,model,callback) {
		var idx = findById(name,key);
		if (idx >= 0) {
			_.extend(data[name][idx],model);
			callback(null,key);
		} else {
			callback(null,null);
		}
		return(this);
	},
	create: function (name,model,callback) {
		var idField = IDFIELDS[name] || "id", len = data[name].length, id = (parseInt(data[name][len-1][idField],10)+1).toString();
		model[idField] = id;
		data[name].push(model);
		callback(null,id);
		return(this);
	},
	destroy: function (name,key,callback) {
		var idx = findById(name,key);
		if (idx >= 0) {
			data[name].splice(idx,1);
			callback(null,key);
		} else {
			callback();
		}
		return(this);
	},
	// simple function to reset data with DATA
	reset : reset,
	data: function (name,idx) {
		var ret;
		if (idx === null || idx === undefined) {
			ret = data[name];
		} else if (typeof(idx) === "number") {
			ret = data[name][idx];
		} else if (typeof(idx) === "string"){
			ret = data[name][findById(name,idx)];
		} else {
			ret = sjs.matchArray(data[name],idx);
		}
		return(ret);
	}
	
};