/*global before,after,describe,it */
/*jslint node:true */
var express = require('express'), _ = require('lodash'), request = require('supertest'), booster = require('../lib/booster'), 
async = require('async'), should = require('should'), db = require('./resources/db');


// call the debugger in case we are in debug mode
describe('booster',function () {
	describe('.resource(name)',function () {
		var app, r;
		describe('without models or controllers',function () {
			before(function (done) {
				db.reset();
				app = this.app = express();
				app.use(express.bodyParser());
				booster.init({db:db,app:app});
				booster.resource('post');
				r = request(app);
				done();
			});
			it('should map LIST',function (done) {
				r.get('/post').expect(200,db.data("post")).end(done);
			});
			it('should map GET',function (done) {
				r.get('/post/1').expect(200,db.data("post",0)).end(done);
			});
			it('should return 404 when GET for absurd ID of post',function (done) {
				r.get('/post/12345').expect(404).end(done);
			});
			it('should map PUT',function (done) {
				async.series([
					function (cb) {r.put('/post/1').send({title:"nowfoo"}).expect(200,cb);},
					function (cb) {r.get('/post/1').expect(200,_.extend({},db.data("post",0),{title:"nowfoo"}),cb);}
				],done);
			});
			it('should return 404 for non-existent PUT for absurd ID',function (done) {
				r.put('/post/12345').send({title:"nowfoo"}).expect(404).end(done);
			});
			it('should map POST',function (done) {
				var newPost = {title:"new post",content:"messy"};
				async.waterfall([
					function (cb) {r.post('/post').send(newPost).expect(201,cb);},
					function (res,cb) {r.get('/post/'+res.text).expect(200,_.extend({},newPost,{id:res.text}),cb);}
				],done);
			});
			it('should map DELETE',function (done) {
				async.series([
					function (cb) {r.del('/post/1').expect(200,cb);},
					function (cb) {r.get('/post/1').expect(404,cb);}
				],done);
			});
			it('should 404 DELETE for absurd ID',function (done) {
				r.del('/post/12345').expect(404).end(done);
			});
		});
		describe('without body parser', function(){
			before(function (done) {
				db.reset();
				app = this.app = express();
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
		describe('at the root path', function(){
			before(function (done) {
				db.reset();
				app = this.app = express();
				app.use(express.bodyParser());
				booster.init({db:db,app:app});
				booster.resource('post',{root:true});
				r = request(app);
				done();
			});
			it('should map LIST',function (done) {
				r.get('/').expect(200,db.data("post")).end(done);
			});
			it('should map GET',function (done) {
				r.get('/1').expect(200,db.data("post",0)).end(done);
			});
			it('should return 404 when GET for absurd ID of post',function (done) {
				r.get('/12345').expect(404).end(done);
			});
			it('should map PUT',function (done) {
				async.series([
					function (cb) {r.put('/1').send({title:"nowfoo"}).expect(200,cb);},
					function (cb) {r.get('/1').expect(200,_.extend({},db.data("post",0),{title:"nowfoo"}),cb);}
				],done);
			});
			it('should return 404 for non-existent PUT for absurd ID',function (done) {
				r.put('/12345').send({title:"nowfoo"}).expect(404).end(done);
			});
			it('should map POST',function (done) {
				var newPost = {title:"new post",content:"messy"};
				async.waterfall([
					function (cb) {r.post('/').send(newPost).expect(201,cb);},
					function (res,cb) {r.get('/'+res.text).expect(200,_.extend({},newPost,{id:res.text}),cb);}
				],done);
			});
			it('should map DELETE',function (done) {
				async.series([
					function (cb) {r.del('/1').expect(200,cb);},
					function (cb) {r.get('/1').expect(404,cb);}
				],done);
			});
			it('should 404 DELETE for absurd ID',function (done) {
				r.del('/12345').expect(404).end(done);
			});		  
		});
		describe('with nested resource', function(){
			before(function (done) {
				db.reset();
				app = this.app = express();
				app.use(express.bodyParser());
				booster.init({db:db,app:app});
				booster.resource('post');
				booster.resource('comment',{parent:'post'});
				r = request(app);
				done();
			});
			it('should map nested LIST',function (done) {
				r.get('/post/1/comment').expect(200,db.data("comment")).end(done);
			});
			it('should map nested GET',function (done) {
				r.get('/post/1/comment/1').expect(200,db.data("comment",0)).end(done);
			});
			it('should return 404 when GET for absurd ID of nested item',function (done) {
				r.get('/post/1/comment/12345').expect(404).end(done);
			});
			it('should map nested PUT',function (done) {
				async.series([
					function (cb) {r.put('/post/1/comment/1').send({comment:"new comment"}).expect(200,cb);},
					function (cb) {r.get('/post/1/comment/1').expect(200,_.extend({},db.data("comment",0),{comment:"new comment"}),cb);}
				],done);
			});
			it('should return 404 for non-existent PUT for nested absurd ID',function (done) {
				r.put('/post/1/comment/12345').send({title:"nowfoo"}).expect(404).end(done);
			});
			it('should map nested POST',function (done) {
				var newPost = {comment:"new comment"};
				async.waterfall([
					function (cb) {r.post('/post/1/comment').send(newPost).expect(201,cb);},
					function (res,cb) {r.get('/post/1/comment/'+res.text).expect(200,_.extend({},newPost,{id:res.text}),cb);}
				],done);
			});
			it('should map nested DELETE',function (done) {
				async.series([
					function (cb) {r.del('/post/1/comment/1').expect(200,cb);},
					function (cb) {r.get('/post/1/comment/1').expect(404,cb);}
				],done);
			});
			it('should 404 DELETE for absurd ID for nested',function (done) {
				r.del('/post/1/comment/12345').expect(404).end(done);
			});		  
		});
		describe('with controllers',function () {
			before(function (done) {
				db.reset();
				app = this.app = express();
				app.use(express.bodyParser());
				booster.init({db:db,app:app,controllers:__dirname+'/resources/controllers'});
				booster.resource('post');
				r = request(app);
				done();
			});
			it('should return 404 when override LIST to null',function (done) {
				r.get('/post').expect(404).end(done);
			});
			it('should map GET to default when no override',function (done) {
				r.get('/post/1').expect(200,db.data("post",0)).end(done);
			});
			it('should return 404 per default when GET with no override for absurd ID of post',function (done) {
				r.get('/post/12345').expect(404).end(done);
			});
			it('should map PUT to override which changes nothing',function (done) {
				async.series([
					function (cb) {r.put('/post/1').send({title:"nowfoo"}).expect(200,"You asked to update 1",cb);},
					function (cb) {r.get('/post/1').expect(200,db.data("post",0),cb);}
				],done);
			});
			it('should map PUT to override which changes nothing for absurd ID',function (done) {
				r.put('/post/12345').send({title:"nowfoo"}).expect(200,"You asked to update 12345").end(done);
			});
			it('should map POST to default when no override',function (done) {
				var newPost = {title:"new post",content:"messy"};
				async.waterfall([
					function (cb) {r.post('/post').send(newPost).expect(201,cb);},
					function (res,cb) {r.get('/post/'+res.text).expect(200,_.extend({},newPost,{id:res.text}),cb);}
				],done);
			});
			it('should map DELETE to default when no override',function (done) {
				async.series([
					function (cb) {r.del('/post/1').expect(200,cb);},
					function (cb) {r.get('/post/1').expect(404,cb);}
				],done);
			});			
			it('should 404 DELETE for absurd ID',function (done) {
				r.del('/post/12345').expect(404).end(done);
			});
		});
		describe('with models',function () {
			before(function (done) {
				db.reset();
				app = this.app = express();
				app.use(express.bodyParser());
				booster.init({db:db,app:app,models:__dirname+'/resources/models'});
				booster.resource('post');				// 'post' data with basic fields
				booster.resource('different');		// 'different' data but instead of id = 'id' has id = 'key'
				booster.resource('normal');			// data remapped to 'special', rest is the same
				booster.resource('user');				// 'user' data with private field email and secret field password
				booster.resource('validated');		// 'validated' data with four validated fields: 'email' (must be 'email'), 'alpha' (must be 'alphanumeric'), 'abc' (function requiring 'abc' and returning true/false) 'def' (function requiring 'def' and returning {valid:true, value:"fed"} if 'def', else {valid:false, message: "not def"} if !'def')
				r = request(app);
				done();
			});
			describe('basic fields',function () {
				it('should fail to LIST with invalid record',function (done) {
					r.get('/post').expect(400,[{other:"unknownfield"}]).end(done);
				});
				it('should successfully GET valid record',function (done) {
					r.get('/post/1').expect(200,db.data("post",0)).end(done);
				});
				it('should reject GET record with field not in defined fields',function (done) {
					r.get('/post/4').expect(400,{ other: 'unknownfield' }).end(done);
				});
				it('should accept PUT with valid fields',function (done) {
					async.series([
						function (cb) {r.put('/post/1').send({title:"nowfoo"}).expect(200,cb);},
						function (cb) {r.get('/post/1').expect(200,_.extend({},db.data("post",0),{title:"nowfoo"}),cb);}
					],done);
				});
				it('should reject PUT with invalid fields',function (done) {
					async.series([
						function (cb) {r.put('/post/1').send({other:"nowfoo"}).expect(400,{other:"unknownfield"},cb);},
						function (cb) {r.get('/post/1').expect(200,db.data("post",0),cb);}
					],done);
				});
				it('should reject PUT that attempts to change mutable field',function (done) {
					async.series([
						function (cb) {r.put('/post/1').send({id:"20"}).expect(400,{id:"immutable"},cb);},
						function (cb) {r.get('/post/1').expect(200,db.data("post",0),cb);}
					],done);
				});
				it('should accept POST with valid fields',function (done) {
					var newpost = {title:"newfoo",content:"foo content"};
					async.waterfall([
						function (cb) {r.post('/post').send(newpost).expect(201,cb);},
						function (res,cb) {r.get('/post/'+res.text).expect(200,_.extend({},newpost,{id:res.text}),cb);}
					],done);
				});
				it('should reject POST with invalid fields',function (done) {
					var newpost = {title:"newfoo",content:"foo content",other:"otherfield"};
					r.post('/post').send(newpost).expect(400,{other: "unknownfield"},done);
				});
			});
			describe('with alternate id',function () {
				it('should map LIST',function (done) {
					r.get('/different').expect(200,db.data("different")).end(done);
				});
				it('should map GET',function (done) {
					r.get('/different/1').expect(200,db.data("different",0)).end(done);
				});
				it('should return 404 when GET for absurd ID',function (done) {
					r.get('/different/12345').expect(404).end(done);
				});
				it('should map PUT',function (done) {
					async.series([
						function (cb) {r.put('/different/1').send({comment:"nowfoo"}).expect(200,cb);},
						function (cb) {r.get('/different/1').expect(200,_.extend({},db.data("different",0),{comment:"nowfoo"}),cb);}
					],done);
				});
				it('should return 404 for non-existent PUT for absurd ID',function (done) {
					r.put('/different/12345').send({comment:"nowfoo"}).expect(404).end(done);
				});
				it('should map POST',function (done) {
					var newRec = {post:"3",comment:"messy"};
					async.waterfall([
						function (cb) {r.post('/different').send(newRec).expect(201,cb);},
						function (res,cb) {r.get('/different/'+res.text).expect(200,_.extend({},newRec,{key:res.text}),cb);}
					],done);
				});
				it('should map DELETE',function (done) {
					async.series([
						function (cb) {r.del('/different/1').expect(200,cb);},
						function (cb) {r.get('/different/1').expect(404,cb);}
					],done);
				});
				it('should 404 DELETE for absurd ID',function (done) {
					r.del('/different/12345').expect(404).end(done);
				});				
			});
			describe('with alternate table name', function(){
				var resource = "normal", table = "special";
				it('should map LIST',function (done) {
					r.get('/'+resource).expect(200,db.data(table)).end(done);
				});
				it('should map GET',function (done) {
					r.get('/'+resource+'/1').expect(200,db.data(table,0)).end(done);
				});
				it('should return 404 when GET for absurd ID',function (done) {
					r.get('/'+resource+'/12345').expect(404).end(done);
				});
				it('should map PUT',function (done) {
					async.series([
						function (cb) {r.put('/'+resource+'/1').send({title:"nowfoo"}).expect(200,cb);},
						function (cb) {r.get('/'+resource+'/1').expect(200,_.extend({},db.data(table,0),{title:"nowfoo"}),cb);}
					],done);
				});
				it('should return 404 for non-existent PUT for absurd ID',function (done) {
					r.put('/'+resource+'/12345').send({title:"nowfoo"}).expect(404).end(done);
				});
				it('should map POST',function (done) {
					var newRec = {title:"new post",content:"messy"};
					async.waterfall([
						function (cb) {r.post('/'+resource).send(newRec).expect(201,cb);},
						function (res,cb) {r.get('/'+resource+'/'+res.text).expect(200,_.extend({},newRec,{id:res.text}),cb);}
					],done);
				});
				it('should map DELETE',function (done) {
					async.series([
						function (cb) {r.del('/'+resource+'/1').expect(200,cb);},
						function (cb) {r.get('/'+resource+'/1').expect(404,cb);}
					],done);
				});
				it('should 404 DELETE for absurd ID',function (done) {
					r.del('/'+resource+'/12345').expect(404).end(done);
				});			
			});
			describe('with different visibility fields', function(){
				var table = "user", data, privatedata, publicdata;
				before(function(){
					data = db.data(table);
					privatedata = db.data("privateuser");
					publicdata = db.data("publicuser");
				});
				describe('for a LIST',function () {
					it('should get raw data without filter', function(){
						booster.models.user.filter(data).should.eql(publicdata);
					});
					it('should get raw data with secret filter', function(){
						booster.models.user.filter(data,"secret").should.eql(data);
					});
					it('should get public data with public filter', function(){
						booster.models.user.filter(data,"public").should.eql(publicdata);
					});
					it('should get public and private data with private filter', function(){
						booster.models.user.filter(data,"private").should.eql(privatedata);
					});
				});
				describe('for a GET', function(){
					it('should get raw data without filter', function(){
						booster.models.user.filter(data[0]).should.eql(publicdata[0]);
					});
					it('should get raw data with secret filter', function(){
						booster.models.user.filter(data[0],"secret").should.eql(data[0]);
					});
					it('should get public data with public filter', function(){
						booster.models.user.filter(data[0],"public").should.eql(publicdata[0]);
					});
					it('should get public and private data with private filter', function(){
						booster.models.user.filter(data[0],"private").should.eql(privatedata[0]);
					});
				});
			});
			describe('with validations', function(){
				var name = "validated", table = name;
				it('should fail to LIST with invalid record',function (done) {
					r.get('/'+name).expect(400,[{email:"email",alpha:"alphanumeric",abc:"invalid"}]).end(done);
				});
				it('should successfully GET valid record',function (done) {
					r.get('/'+name+'/1').expect(200,db.data(table,0)).end(done);
				});
				it('should reject GET record with invalid fields',function (done) {
					r.get('/'+name+'/2').expect(400,{email:"email",alpha:"alphanumeric",abc:"invalid"}).end(done);
				});
				it('should accept PUT with valid fields',function (done) {
					async.series([
						function (cb) {r.put('/'+name+'/1').send({alpha:"bigAl"}).expect(200,cb);},
						function (cb) {r.get('/'+name+'/1').expect(200,_.extend({},db.data(table,0),{alpha:"bigAl"}),cb);}
					],done);
				});
				it('should reject PUT with one invalid field',function (done) {
					async.series([
						function (cb) {r.put('/'+name+'/1').send({alpha:"not ! alpha"}).expect(400,{alpha:"alphanumeric"},cb);},
						function (cb) {r.get('/'+name+'/1').expect(200,db.data(table,0),cb);}
					],done);
				});
				it('should reject PUT with multiple invalid field',function (done) {
					async.series([
						function (cb) {r.put('/'+name+'/1').send({alpha:"not ! alpha",email:"a@b"}).expect(400,{email:"email",alpha:"alphanumeric"},cb);},
						function (cb) {r.get('/'+name+'/1').expect(200,db.data(table,0),cb);}
					],done);
				});
				it('should give correct response reject for PUT with validation function and boolean response',function (done) {
					async.series([
						function (cb) {r.put('/'+name+'/1').send({abc:"cba"}).expect(400,{abc:"invalid"},cb);},
						function (cb) {r.get('/'+name+'/1').expect(200,db.data(table,0),cb);}
					],done);
				});
				it('should give correct response reject for PUT with validation function and object response',function (done) {
					async.series([
						function (cb) {r.put('/'+name+'/1').send({def:"fed"}).expect(400,{def:"not def"},cb);},
						function (cb) {r.get('/'+name+'/1').expect(200,db.data(table,0),cb);}
					],done);
				});
				it('should accept PUT with valid fields and validation function with transformation',function (done) {
					async.series([
						function (cb) {r.put('/'+name+'/1').send({def:"def"}).expect(200,cb);},
						function (cb) {r.get('/'+name+'/1').expect(200,_.extend({},db.data(table,0),{def:"fed"}),cb);}
					],done);
				});
				it('should accept POST with valid fields and transformation',function (done) {
					var newpost = {email:"a@b.com",alpha:"abc123",abc:"abc",def:"def"};
					async.waterfall([
						function (cb) {r.post('/'+name).send(newpost).expect(201,cb);},
						// remember that the "def" field, when valid, gets transformed to "fed"
						function (res,cb) {r.get('/'+name+'/'+res.text).expect(200,_.extend({},newpost,{id:res.text,def:"fed"}),cb);}
					],done);
				});
				it('should reject POST with single invalid field',function (done) {
					var newpost = {email:"a@b",alpha:"abc123",abc:"abc",def:"def"};
					r.post('/'+name).send(newpost).expect(400,{email: "email"},done);
				});			  
				it('should reject POST with multiple invalid fields',function (done) {
					var newpost = {email:"a@b",alpha:"! alpha",abc:"abc",def:"def"};
					r.post('/'+name).send(newpost).expect(400,{email: "email",alpha:"alphanumeric"},done);
				});
				it('should give correct response reject for POST with validation function and boolean response',function (done) {
					var newpost = {email:"a@b.com",alpha:"abc123",abc:"cba",def:"def"};
					r.post('/'+name).send(newpost).expect(400,{abc:"invalid"},done);
				});
				it('should give correct response reject for POST with validation function and object response',function (done) {
					var newpost = {email:"a@b.com",alpha:"abc123",abc:"abc",def:"fed"};
					r.post('/'+name).send(newpost).expect(400,{def:"not def"},done);
				});				 
			});
		});
	});
});
