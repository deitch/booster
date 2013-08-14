/*jslint node:true, nomen:true */
var _ = require('lodash'), sjs = require('searchjs'), DATA = {
	post: [
	  {id:"1",title:"foo",content:"Lots of it"},
	  {id:"2",title:"foobar",content:"Even more"},
	  {id:"3",title:"bar",content:"phd"},
	  {id:"4",title:"bar",content:"phd",other:"other field"}
	],
	property: [
	  {id:"1",title:"foo",content:"Lots of it"},
	  {id:"2",title:"foobar",content:"Even more"}
	],
	filter: [
	  {id:"1",title:"filter",content:"I am filtered"}
	],
	comment: [
		{id:"1",post:"1",comment:"First comment on 1st post"},
		{id:"2",post:"1",comment:"Second comment on 1st post"},
		{id:"3",post:"3",comment:"First comment on 3rd post"}
	],
	different: [
		{key:"1",post:"1",comment:"First comment on 1st post"},
		{key:"2",post:"1",comment:"Second comment on 1st post"},
		{key:"3",post:"3",comment:"First comment on 3rd post"}
	],
	special: [
	  {id:"1",title:"foo",content:"Lots of it"},
	  {id:"2",title:"foobar",content:"Even more"},
	  {id:"3",title:"bar",content:"phd"},
	],
	user: [
	  {id:"1",name:"john",email:"john@email.com",password:"abc"},
	  {id:"2",name:"jill",email:"jill@email.com",password:"def"},
	  {id:"3",name:"jim",email:"jim@email.com",password:"ghi"}
	],
	privateuser: [
	  {id:"1",name:"john",email:"john@email.com"},
	  {id:"2",name:"jill",email:"jill@email.com"},
	  {id:"3",name:"jim",email:"jim@email.com"}
	],
	publicuser: [
	  {id:"1",name:"john"},
	  {id:"2",name:"jill"},
	  {id:"3",name:"jim"}
	],
	validated: [
		{id:"1",email:"a@email.com",alpha:"abcd",abc:"abc",def:"def"},
		{id:"2",email:"bad@mail",alpha:"abcd !",abc:"aa",def:"fff"}
	],
	avalidated: [
		{id:"1",email:"a@email.com",alpha:"abcd",abc:"abc",def:"def"},
		{id:"2",email:"bad@mail",alpha:"abcd !",abc:"aa",def:"fff"}
	],
	singleunique: [
		{id:"1",firstname:"sam",lastname:"smith"},
		{id:"2",firstname:"jill",lastname:"jones"}
	],
	doubleunique: [
		{id:"1",firstname:"sam",lastname:"smith"},
		{id:"2",firstname:"jill",lastname:"jones"}
	],
	combounique: [
		{id:"1",firstname:"sam",lastname:"smith"},
		{id:"2",firstname:"jill",lastname:"jones"}
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
		var idx = findById(name,key);
		callback(null,data[name][idx]);
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
		return(typeof(idx) === "number" ? data[name][idx] : data[name]);
	}
	
};