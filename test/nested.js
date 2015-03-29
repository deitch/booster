/*global beforeEach,describe,it */
/*jslint node:true, debug:true, nomen:true */
/*jshint unused:vars */
var express = require('express'), _ = require('lodash'), request = require('supertest'), booster = require('../lib/booster'), 
async = require('async'), db = require('./resources/db'), bodyParser = require('body-parser');



// call the debugger in case we are in debug mode
describe('nested',function () {
	var app, r;
	beforeEach(function(){
		db.reset();
		app = this.app = express();
		app.use(bodyParser.urlencoded({extended:true}));
		app.use(bodyParser.json());
	});
	describe('with nested resource', function(){
		beforeEach(function (done) {
			booster.init({db:db,app:app});
			booster.resource('post');
			booster.resource('user');
			booster.resource('comment',{parent:'post'},{only:["index","show"]});
			booster.resource('nestRequire',{parent:'post',parentProperty:true});
			booster.resource('nestOptional',{parent:'post',parentProperty:true,parentDefault:true});
			booster.resource('doublenest',{parent:'post'},{parent:'user'});
			booster.resource('nestwithonly',{parent:'post',only:["index","show"]});
			booster.resource('multiparent',{},{parent:'post'});
			booster.resource('multichild',{},{parent:'multiparent'});
			r = request(app);
			done();
		});
		describe('regular', function(){
			it('should map nested LIST',function (done) {
				r.get('/post/1/comment').expect(200,done);
			});
			it('should have nested LIST return correct resource even if parent has property of that name',function (done) {
				r.get('/post/1/comment').expect(200,db.data("comment",{post:"1"})).end(done);
			});
			it('should map nested LIST for multiple parent',function (done) {
				r.get('/post/1,3/comment').expect(200,db.data("comment",{post:["1","3"]})).end(done);
			});
			it('should map nested GET',function (done) {
				r.get('/post/1/comment/1').expect(200,db.data("comment",0)).end(done);
			});
			it('should not map nested GET with different parent',function (done) {
				r.get('/post/1/comment/3').expect(404,done);
			});
			it('should return 404 when GET for absurd ID of nested item',function (done) {
				r.get('/post/1/comment/12345').expect(404).end(done);
			});
			it('should map nested PUT',function (done) {
				var rec = {comment:"new comment",post:"1"};
				async.series([
					function (cb) {r.put('/post/1/comment/1').send(rec).expect(200,cb);},
					function (cb) {r.get('/post/1/comment/1').expect(200,_.extend({},rec,{id:"1"}),cb);}
				],done);
			});
			it('should map nested PATCH',function (done) {
				var rec = {comment:"new comment"};
				async.series([
					function (cb) {r.patch('/post/1/comment/1').send(rec).expect(200,cb);},
					function (cb) {r.get('/post/1/comment/1').expect(200,_.extend({},db.data("comment",0),rec),cb);}
				],done);
			});
			it('should return 404 for non-existent PUT for nested absurd ID',function (done) {
				r.put('/post/1/comment/12345').send({title:"nowfoo"}).expect(404).end(done);
			});
			it('should map nested POST',function (done) {
				var newPost = {comment:"new comment",post:"1"};
				async.waterfall([
					function (cb) {r.post('/post/1/comment').send(newPost).expect(201,cb);},
					function (res,cb) {r.get('/post/1/comment/'+res.text).expect(200,_.extend({},newPost,{id:res.text}),cb);}
				],done);
			});
			it('should map nested DELETE',function (done) {
				async.series([
					function (cb) {r.del('/post/1/comment/1').expect(204,cb);},
					function (cb) {r.get('/post/1/comment/1').expect(404,cb);}
				],done);
			});
			it('should 404 DELETE for absurd ID for nested',function (done) {
				r.del('/post/1/comment/12345').expect(404).end(done);
			});
			it('should map doublenest LIST to first parent', function(done){
				r.get('/post/1/doublenest').expect(200,db.data("doublenest",{post:"1"})).end(done);
			});
			it('should map doublenest LIST to second parent', function(done){
				r.get('/user/1/doublenest').expect(200,db.data("doublenest",{user:"1"})).end(done);
			});
		});
		describe('nestwithonly', function(){
			it('should map nested LIST',function (done) {
				r.get('/post/1/nestwithonly').expect(200,db.data("nestwithonly",{post:"1"})).end(done);
			});
			it('should map nested GET',function (done) {
				r.get('/post/1/comment/1').expect(200,db.data("nestwithonly",0)).end(done);
			});
		});
		describe('parent property', function(){
			it('should reject POST when missing parent property', function(done){
			  r.post('/post/1/nestRequire').send({comment:"new comment"}).type('json').expect(400,done);
			});
			it('should reject POST when conflicting parent property', function(done){
			  r.post('/post/1/nestRequire').send({comment:"new comment",post:"2"}).type('json').expect(400,done);
			});
			it('should accept POST when matching parent property', function(done){
				var newitem = {comment:"new comment",post:"1"};
				async.waterfall([
					function(cb) {r.post('/post/1/nestRequire').send(newitem).type('json').expect(201,cb);},
					function(res,cb) {r.get('/post/1/nestRequire/'+res.text).expect(200,_.extend({},newitem,{id:res.text}),cb);}
				],done);
			});
			it('should reject PUT when missing parent property', function(done){
			  r.put('/post/1/nestRequire/1').send({comment:"new comment"}).type('json').expect(400,done);
			});
			it('should reject PUT when conflicting parent property', function(done){
			  r.put('/post/1/nestRequire/1').send({comment:"new comment",post:"2"}).type('json').expect(400,done);
			});
			it('should accept PUT when matching parent property', function(done){
				var newitem = {comment:"new comment",post:"1"};
				async.waterfall([
					function(cb) {r.put('/post/1/nestRequire/1').send(newitem).type('json').expect(200,cb);},
					function(res,cb) {r.get('/post/1/nestRequire/1').expect(200,_.extend({},newitem,{id:"1"}),cb);}
				],done);
			});
			it('should accept PATCH when missing parent property', function(done){
				var newitem = {comment:"new comment"};
				async.waterfall([
					function(cb) {r.patch('/post/1/nestRequire/1').send(newitem).type('json').expect(200,cb);},
					function(res,cb) {r.get('/post/1/nestRequire/1').expect(200,_.extend({},newitem,{id:"1",post:"1"}),cb);}
				],done);
			});
			it('should reject PATCH when conflicting parent property', function(done){
			  r.patch('/post/1/nestRequire/1').send({comment:"new comment",post:"2"}).type('json').expect(400,done);
			});
			it('should accept PATCH when matching parent property', function(done){
				var newitem = {comment:"new comment",post:"1"};
				async.waterfall([
					function(cb) {r.patch('/post/1/nestRequire/1').send(newitem).type('json').expect(200,cb);},
					function(res,cb) {r.get('/post/1/nestRequire/1').expect(200,_.extend({},newitem,{id:"1"}),cb);}
				],done);
			});
		});
		describe('parent default', function(){
			it('should accept POST when missing parent property', function(done){
				var newitem = {comment:"new comment"};
				async.waterfall([
					function(cb) {r.post('/post/1/nestOptional').send(newitem).type('json').expect(201,cb);},
					function(res,cb) {r.get('/post/1/nestOptional/'+res.text).expect(200,_.extend({},newitem,{id:res.text,post:"1"}),cb);}
				],done);
			});
			it('should reject POST when conflicting parent property', function(done){
			  r.post('/post/1/nestOptional').send({comment:"new comment",post:"2"}).type('json').expect(400,done);
			});
			it('should accept POST when matching parent property', function(done){
				var newitem = {comment:"new comment",post:"1"};
				async.waterfall([
					function(cb) {r.post('/post/1/nestOptional').send(newitem).type('json').expect(201,cb);},
					function(res,cb) {r.get('/post/1/nestOptional/'+res.text).expect(200,_.extend({},newitem,{id:res.text}),cb);}
				],done);
			});
			it('should accept PUT when missing parent property', function(done){
				var newitem = {comment:"new comment"};
				async.waterfall([
					function(cb) {r.put('/post/1/nestOptional/1').send(newitem).type('json').expect(200,cb);},
					function(res,cb) {r.get('/post/1/nestOptional/1').expect(200,_.extend({},newitem,{id:"1",post:"1"}),cb);}
				],done);
			});
			it('should reject PUT when conflicting parent property', function(done){
			  r.put('/post/1/nestOptional/1').send({comment:"new comment",post:"2"}).type('json').expect(400,done);
			});
			it('should accept PUT when matching parent property', function(done){
				var newitem = {comment:"new comment",post:"1"};
				async.waterfall([
					function(cb) {r.put('/post/1/nestOptional/1').send(newitem).type('json').expect(200,cb);},
					function(res,cb) {r.get('/post/1/nestOptional/1').expect(200,_.extend({},newitem,{id:"1"}),cb);}
				],done);
			});
		});
		describe('parent has multiple paths', function(){
			it('should map LIST at child base', function(done){
				r.get('/multichild').expect(200,db.data("multichild")).end(done);
			});
			it('should map GET at child base', function(done){
				r.get('/multichild/1').expect(200,db.data("multichild",0)).end(done);
			});
			it('should map LIST at parent base', function(done){
				r.get('/multiparent/1/multichild').expect(200,db.data("multichild")).end(done);
			});
			it('should map GET at parent base', function(done){
				r.get('/multiparent/1/multichild/1').expect(200,db.data("multichild",0)).end(done);
			});
			it('should map LIST at parent long', function(done){
				r.get('/post/1/multiparent/1/multichild').expect(200,db.data("multichild")).end(done);
			});
			it('should map GET at parent long', function(done){
				r.get('/post/1/multiparent/1/multichild/1').expect(200,db.data("multichild",0)).end(done);
			});
		});
		describe('multiple options', function(){
			it('should map LIST at base',function (done) {
				r.get('/comment').expect(200,db.data("comment")).end(done);
			});
			it('should map GET at base',function (done) {
				r.get('/comment/1').expect(200,db.data("comment",0)).end(done);
			});
			it('should return 404 when GET at base for absurd ID',function (done) {
				r.get('/comment/12345').expect(404).end(done);
			});
			it('should have no PUT at base',function (done) {
				r.put('/comment/1').expect(404,done);
			});
			it('should have no PATCH at base',function (done) {
				r.patch('/comment/1').expect(404,done);
			});
			it('should have no DELETE at base',function (done) {
				r.del('/comment/1').expect(404,done);
			});
			it('should have no POST at base',function (done) {
				r.post('/comment/1').expect(404,done);
			});
			it('should retrieve via base correct object created via nest',function (done) {
				var newPost = {comment:"new comment"};
				async.waterfall([
					function (cb) {r.post('/post/1/comment').send(newPost).expect(201,cb);},
					function (res,cb) {r.get('/comment/'+res.text).expect(200,_.extend({},newPost,{id:res.text}),cb);}
				],done);
			});
		});			
	});
});
