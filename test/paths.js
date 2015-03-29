/*global beforeEach,describe,it */
/*jslint node:true, debug:true, nomen:true */
/*jshint unused:vars */
var express = require('express'), _ = require('lodash'), request = require('supertest'), booster = require('../lib/booster'), 
async = require('async'), db = require('./resources/db'), path, bodyParser = require('body-parser');


// call the debugger in case we are in debug mode
describe('paths',function () {
	var app, r;
	beforeEach(function(){
		db.reset();
		app = this.app = express();
		app.use(bodyParser.urlencoded({extended:true}));
		app.use(bodyParser.json());
	});
	describe('at the root path', function(){
		beforeEach(function (done) {
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
			var rec = {title:"nowfoo"};
			async.series([
				function (cb) {r.put('/1').send(rec).expect(200,cb);},
				function (cb) {r.get('/1').expect(200,_.extend({},rec,{id:"1"}),cb);}
			],done);
		});
		it('should map PATCH',function (done) {
			var rec = {title:"nowfoo"};
			async.series([
				function (cb) {r.patch('/1').send(rec).expect(200,cb);},
				function (cb) {r.get('/1').expect(200,_.extend({},db.data("post",0),rec),cb);}
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
				function (cb) {r.del('/1').expect(204,cb);},
				function (cb) {r.get('/1').expect(404,cb);}
			],done);
		});
		it('should 404 DELETE for absurd ID',function (done) {
			r.del('/12345').expect(404).end(done);
		});		  
	});
	describe('with added basepath', function(){
		describe('resource-specific', function(){
			describe('without trailing slash', function(){
				beforeEach(function (done) {
					booster.init({db:db,app:app});
					booster.resource('post',{base:'/api'});
					r = request(app);
					path = '/api/post';
					done();
				});
				it('should map LIST',function (done) {
					r.get(path).expect(200,db.data("post")).end(done);
				});
				it('should map GET',function (done) {
					r.get(path+'/1').expect(200,db.data("post",0)).end(done);
				});
				it('should return 404 when GET for absurd ID of post',function (done) {
					r.get(path+'/12345').expect(404).end(done);
				});
				it('should map PUT',function (done) {
					async.series([
						function (cb) {r.put(path+'/1').send({title:"nowfoo"}).expect(200,cb);},
						function (cb) {r.get(path+'/1').expect(200,_.extend({},{title:"nowfoo"},{id:"1"}),cb);}
					],done);
				});
				it('should map PATCH',function (done) {
					var rec = {title:"nowfoo"};
					async.series([
						function (cb) {r.patch(path+'/1').send(rec).expect(200,cb);},
						function (cb) {r.get(path+'/1').expect(200,_.extend({},db.data("post",0),rec),cb);}
					],done);
				});
				it('should return 404 for non-existent PUT for absurd ID',function (done) {
					r.put(path+'/12345').send({title:"nowfoo"}).expect(404).end(done);
				});
				it('should map POST',function (done) {
					var newPost = {title:"new post",content:"messy"};
					async.waterfall([
						function (cb) {r.post(path+'/').send(newPost).expect(201,cb);},
						function (res,cb) {r.get(path+'/'+res.text).expect(200,_.extend({},newPost,{id:res.text}),cb);}
					],done);
				});
				it('should map DELETE',function (done) {
					async.series([
						function (cb) {r.del(path+'/1').expect(204,cb);},
						function (cb) {r.get(path+'/1').expect(404,cb);}
					],done);
				});
				it('should 404 DELETE for absurd ID',function (done) {
					r.del(path+'/12345').expect(404).end(done);
				});		  
			});
			describe('with trailing slash', function(){
				beforeEach(function (done) {
					booster.init({db:db,app:app});
					booster.resource('post',{base:'/api/'});
					r = request(app);
					path = '/api/post';
					done();
				});
				it('should map LIST',function (done) {
					r.get(path).expect(200,db.data("post")).end(done);
				});
				it('should map GET',function (done) {
					r.get(path+'/1').expect(200,db.data("post",0)).end(done);
				});
				it('should return 404 when GET for absurd ID of post',function (done) {
					r.get(path+'/12345').expect(404).end(done);
				});
				it('should map PUT',function (done) {
					async.series([
						function (cb) {r.put(path+'/1').send({title:"nowfoo"}).expect(200,cb);},
						function (cb) {r.get(path+'/1').expect(200,_.extend({},db.data("post",0),{title:"nowfoo"}),cb);}
					],done);
				});
				it('should return 404 for non-existent PUT for absurd ID',function (done) {
					r.put(path+'/12345').send({title:"nowfoo"}).expect(404).end(done);
				});
				it('should map POST',function (done) {
					var newPost = {title:"new post",content:"messy"};
					async.waterfall([
						function (cb) {r.post(path+'/').send(newPost).expect(201,cb);},
						function (res,cb) {r.get(path+'/'+res.text).expect(200,_.extend({},newPost,{id:res.text}),cb);}
					],done);
				});
				it('should map DELETE',function (done) {
					async.series([
						function (cb) {r.del(path+'/1').expect(204,cb);},
						function (cb) {r.get(path+'/1').expect(404,cb);}
					],done);
				});
				it('should 404 DELETE for absurd ID',function (done) {
					r.del(path+'/12345').expect(404).end(done);
				});		  
			});
		});
		describe('global', function(){
			beforeEach(function (done) {
				booster.init({db:db,app:app,base:'/api2'});
				booster.resource('post');
				r = request(app);
				path = '/api2/post';
				done();
			});
			it('should map LIST',function (done) {
				r.get(path).expect(200,db.data("post")).end(done);
			});
			it('should map GET for single item',function (done) {
				r.get(path+'/1').expect(200,db.data("post",0)).end(done);
			});
			it('should map GET for multiple items',function (done) {
				r.get(path+'/1,2').expect(200,[db.data("post",0),db.data("post",1)]).end(done);
			});
			it('should return 404 when GET for absurd ID of post',function (done) {
				r.get(path+'/12345').expect(404).end(done);
			});
			it('should map PUT',function (done) {
				async.series([
					function (cb) {r.put(path+'/1').send({title:"nowfoo"}).expect(200,cb);},
					function (cb) {r.get(path+'/1').expect(200,_.extend({},{title:"nowfoo"},{id:"1"}),cb);}
				],done);
			});
			it('should map PATCH',function (done) {
				var rec = {title:"nowfoo"};
				async.series([
					function (cb) {r.patch(path+'/1').send(rec).expect(200,cb);},
					function (cb) {r.get(path+'/1').expect(200,_.extend({},db.data("post",0),rec),cb);}
				],done);
			});
			it('should return 404 for non-existent PUT for absurd ID',function (done) {
				r.put(path+'/12345').send({title:"nowfoo"}).expect(404).end(done);
			});
			it('should map POST',function (done) {
				var newPost = {title:"new post",content:"messy"};
				async.waterfall([
					function (cb) {r.post(path+'/').send(newPost).expect(201,cb);},
					function (res,cb) {r.get(path+'/'+res.text).expect(200,_.extend({},newPost,{id:res.text}),cb);}
				],done);
			});
			it('should map DELETE',function (done) {
				async.series([
					function (cb) {r.del(path+'/1').expect(204,cb);},
					function (cb) {r.get(path+'/1').expect(404,cb);}
				],done);
			});
			it('should 404 DELETE for absurd ID',function (done) {
				r.del(path+'/12345').expect(404).end(done);
			});
		});
	});
});
