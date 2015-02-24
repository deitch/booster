/*global beforeEach,describe,it */
/*jslint node:true, debug:true, nomen:true */
/*jshint unused:vars */
var express = require('express'), _ = require('lodash'), request = require('supertest'), booster = require('../lib/booster'), 
async = require('async'), db = require('./resources/db');



// call the debugger in case we are in debug mode
describe('body parser missing',function () {
	var app, r;
	beforeEach(function(){
		db.reset();
		app = this.app = express();
	});
	beforeEach(function (done) {
		booster.init({db:db,app:app});
		booster.resource('post');
		r = request(app);
		done();
	});
	it('should successfully GET', function(done){
		r.get('/post/1').expect(200,db.data("post",0),done);
	});
	it('should successfully PUT', function(done){
		async.series([
			function (cb) {r.put('/post/1').send({title:"nowfoo"}).expect(200,cb);},
			function (cb) {r.get('/post/1').expect(200,_.extend({},{title:"nowfoo",id:"1"}),cb);}
		],done);
	});
	it('should successfully PATCH', function(done){
		async.series([
			function (cb) {r.patch('/post/1').send({title:"nowfoo"}).expect(200,cb);},
			function (cb) {r.get('/post/1').expect(200,_.extend({},db.data("post",0),{title:"nowfoo"}),cb);}
		],done);
	});
	it('should successfully POST', function(done){
		var newPost = {title:"new post",content:"messy"};
		async.waterfall([
			function (cb) {r.post('/post').send(newPost).expect(201,cb);},
			function (res,cb) {r.get('/post/'+res.text).expect(200,_.extend({},newPost,{id:res.text}),cb);}
		],done);
	});
});
