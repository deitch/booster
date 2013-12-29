/*jslint node:true, nomen:true */
var _ = require('lodash'), async = require('async'), 
orm = require('orm'), db, settings = require('./orm2-settings'), DATA = {
	post: [
	  {title:"foo",content:"Lots of it"},
	  {title:"foobar",content:"Even more"},
	  {title:"bar",content:"phd"},
	  {title:"bar",content:"phd",other:"other field"}
	],
	comment: [
		{post:1,comment:"First comment on 1st post"},
		{post:1,comment:"Second comment on 1st post"},
		{post:3,comment:"First comment on 3rd post"}
	]
}, models = {}, reset = function (callback) {
	// remove all existing ones and create new
	async.series([
		function(cb) {db.drop(cb);},
		function(cb) {db.sync(cb);},
		function(cb) {models.post.create(DATA.post,cb);},
		function(cb) {
			models.comment.create(DATA.comment[0],cb);
		}
	],callback);
};

orm.connect(settings.database,function(err,d){
	if (err) {
		throw err;
	}
	db = d;
	db.settings.set("properties.association_key","{name}");
	models.post = db.define("post",{
		title: String,
		content: String,
		other: String
	});
	models.comment = db.define("comment",{
		comment: String
	});
	models.comment.hasOne("post",models.post,{required:true});
	reset();
});

/*
 - create the database
 - on close app, remove the database
 - set up reset - drop tables, create tables
 - relational between comment and post?
 - load up the tables
 */


module.exports = {
	get: function (name,key,callback) {
		var d = [], ret;
		// might have an array of keys
		models[name].get(key,function (err,items) {
			switch((items||[]).length) {
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
		});
		return(this);
	},
	find: function (name,search,callback) {
		models[name].find(search,callback);
		return(this);
	},
	update: function (name,key,model,callback) {
		models[name].get(key,function (err,item) {
			if (item && item.length > 0) {
				item.save(model,function (err) {
					callback(null,key);
				});
			} else {
				callback(null,null);
			}
		});
		return(this);
	},
	patch: function (name,key,model,callback) {
		this.update(name,key,model,callback);
		return(this);
	},
	create: function (name,model,callback) {
		models[name].create([model],function (err,items) {
			callback(null,[].concat(items)[0].id);
		});
		return(this);
	},
	destroy: function (name,key,callback) {
		models[name].get(key,function (err,item) {
			if (item && item.length > 0) {
				item.remove(function (err) {
					callback(null,key);
				});
			} else {
				callback();
			}
		});
		return(this);
	},
	// simple function to reset data with DATA
	reset : reset
	
};