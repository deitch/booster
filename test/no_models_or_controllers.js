/*global beforeEach,describe,it */
/*jslint node:true, debug:true, nomen:true */
/*jshint unused:vars */
var express = require('express'), _ = require('lodash'), request = require('supertest'), booster = require('../lib/booster'), 
async = require('async'), db = require('./resources/db'), bodyParser = require('body-parser');



// call the debugger in case we are in debug mode
describe('no models or controllers',function () {
	var app, r;
	beforeEach(function(){
		db.reset();
		app = this.app = express();
		app.use(bodyParser.urlencoded({extended:true}));
		app.use(bodyParser.json());
	});
	describe('basic', function(){
		beforeEach(function (done) {
			booster.init({db:db,app:app});
			booster.resource('post');
			r = request(app);
			done();
		});
		it('should map LIST',function (done) {
			r.get('/post').expect(200,db.data("post")).end(done);
		});
		it('should map SEARCH for exact match',function (done) {
			r.get('/post').query({title:"foobar"}).expect(200,db.data("post",{title:"foobar"})).end(done);
		});
		it('should map SEARCH for partial match',function (done) {
			r.get('/post').query({title:"foo"}).expect(200,db.data("post",{title:"foo"})).end(done);
		});
		it('should map SEARCH for ignore-case match',function (done) {
			r.get('/post').query({title:"FOObAR"}).expect(200,db.data("post",{title:"foobar"})).end(done);
		});
		it('should return empty set for SEARCH without results',function (done) {
			r.get('/post').query({title:"ABCDEFG"}).expect(200,[]).end(done);
		});
		it('should return 404 for unknown resource', function(done){
		  r.get('/poster').expect(404,done);
		});
		it('should map GET',function (done) {
			r.get('/post/1').expect(200,db.data("post",0)).end(done);
		});
		it('should return 404 when GET for absurd ID',function (done) {
			r.get('/post/12345').expect(404).end(done);
		});
		it('should map PUT',function (done) {
			var rec = {title:"nowfoo"};
			async.series([
				function (cb) {r.put('/post/1').send(rec).expect(200,cb);},
				function (cb) {r.get('/post/1').expect(200,_.extend(rec,{id:"1"}),cb);}
			],done);
		});
		it('should map PATCH',function (done) {
			var rec = {title:"nowfoo"};
			async.series([
				function (cb) {r.patch('/post/1').send(rec).expect(200,cb);},
				function (cb) {r.get('/post/1').expect(200,_.extend({},db.data("post",0),rec),cb);}
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
				function (cb) {r.del('/post/1').expect(204,cb);},
				function (cb) {r.get('/post/1').expect(404,cb);}
			],done);
		});
		it('should 404 DELETE for absurd ID',function (done) {
			r.del('/post/12345').expect(404).end(done);
		});
		describe('with extension', function(){
			it('should map LIST',function (done) {
				r.get('/post.json').expect(200,db.data("post")).end(done);
			});
			it('should return 404 for unknown resource', function(done){
			  r.get('/poster.json').expect(404,done);
			});
			it('should map GET',function (done) {
				r.get('/post/1.json').expect(200,db.data("post",0)).end(done);
			});
			it('should return 404 when GET for absurd ID',function (done) {
				r.get('/post/12345.json').expect(404).end(done);
			});
			it('should map PUT',function (done) {
				var rec = {title:"nowfoo"};
				async.series([
					function (cb) {r.put('/post/1.json').send(rec).expect(200,cb);},
					function (cb) {r.get('/post/1.json').expect(200,_.extend(rec,{id:"1"}),cb);}
				],done);
			});
			it('should map PATCH',function (done) {
				var rec = {title:"nowfoo"};
				async.series([
					function (cb) {r.patch('/post/1.json').send(rec).expect(200,cb);},
					function (cb) {r.get('/post/1.json').expect(200,_.extend({},db.data("post",0),rec),cb);}
				],done);
			});
			it('should return 404 for non-existent PUT for absurd ID',function (done) {
				r.put('/post/12345.json').send({title:"nowfoo"}).expect(404).end(done);
			});
			it('should map POST',function (done) {
				var newPost = {title:"new post",content:"messy"};
				async.waterfall([
					function (cb) {r.post('/post.json').send(newPost).expect(201,cb);},
					function (res,cb) {r.get('/post/'+res.text+'.json').expect(200,_.extend({},newPost,{id:res.text}),cb);}
				],done);
			});
			it('should map DELETE',function (done) {
				async.series([
					function (cb) {r.del('/post/1.json').expect(204,cb);},
					function (cb) {r.get('/post/1.json').expect(404,cb);}
				],done);
			});
			it('should 404 DELETE for absurd ID',function (done) {
				r.del('/post/12345.json').expect(404).end(done);
			});				  
		});
	});

	describe('pluralize', function(){
		beforeEach(function (done) {
			booster.init({db:db,app:app});
			booster.resource('post',{pluralize:true});
			r = request(app);
			done();
		});
		it('should map LIST',function (done) {
			r.get('/posts').expect(200,db.data("post")).end(done);
		});
		it('should map SEARCH for exact match',function (done) {
			r.get('/posts').query({title:"foobar"}).expect(200,db.data("post",{title:"foobar"})).end(done);
		});
		it('should map SEARCH for partial match',function (done) {
			r.get('/posts').query({title:"foo"}).expect(200,db.data("post",{title:"foo"})).end(done);
		});
		it('should map SEARCH for ignore-case match',function (done) {
			r.get('/posts').query({title:"FOObAR"}).expect(200,db.data("post",{title:"foobar"})).end(done);
		});
		it('should return empty set for SEARCH without results',function (done) {
			r.get('/posts').query({title:"ABCDEFG"}).expect(200,[]).end(done);
		});
		it('should map GET',function (done) {
			r.get('/posts/1').expect(200,db.data("post",0)).end(done);
		});
		it('should return 404 when GET for absurd ID',function (done) {
			r.get('/posts/12345').expect(404).end(done);
		});
		it('should map PUT',function (done) {
			var rec = {title:"nowfoo"};
			async.series([
				function (cb) {r.put('/posts/1').send(rec).expect(200,cb);},
				function (cb) {r.get('/posts/1').expect(200,_.extend(rec,{id:"1"}),cb);}
			],done);
		});
		it('should map PATCH',function (done) {
			var rec = {title:"nowfoo"};
			async.series([
				function (cb) {r.patch('/posts/1').send(rec).expect(200,cb);},
				function (cb) {r.get('/posts/1').expect(200,_.extend({},db.data("post",0),rec),cb);}
			],done);
		});
		it('should return 404 for non-existent PUT for absurd ID',function (done) {
			r.put('/posts/12345').send({title:"nowfoo"}).expect(404).end(done);
		});
		it('should map POST',function (done) {
			var newPost = {title:"new post",content:"messy"};
			async.waterfall([
				function (cb) {r.post('/posts').send(newPost).expect(201,cb);},
				function (res,cb) {r.get('/posts/'+res.text).expect(200,_.extend({},newPost,{id:res.text}),cb);}
			],done);
		});
		it('should map DELETE',function (done) {
			async.series([
				function (cb) {r.del('/posts/1').expect(204,cb);},
				function (cb) {r.get('/posts/1').expect(404,cb);}
			],done);
		});
		it('should 404 DELETE for absurd ID',function (done) {
			r.del('/posts/12345').expect(404).end(done);
		});
	});

	describe('body object', function(){
		describe('no init setting', function(){
			beforeEach(function (done) {
				booster.init({db:db,app:app});
				booster.resource('post');
				r = request(app);
				done();
			});
			describe('PUT', function(){
			  it('should send no body with no header or param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1').send(rec).expect(200,"1",done);
			  });
			  it('should send body with no header but true param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1?sendObject=true').send(rec).expect(200,_.extend(rec,{id:"1"}),done);
			  });
			  it('should send body with true header but no param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1').set("X-Booster-SendObject","true").send(rec).expect(200,_.extend(rec,{id:"1"}),done);
			  });
			  it('should send body with true header and true param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1?sendObject=true').set("X-Booster-SendObject","true").send(rec).expect(200,_.extend(rec,{id:"1"}),done);
			  });
			  it('should send no body with true header and false param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1?sendObject=false').set("X-Booster-SendObject","true").send(rec).expect(200,"1",done);
			  });
			  it('should send body with false header and true param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1?sendObject=true').set("X-Booster-SendObject","false").send(rec).expect(200,_.extend(rec,{id:"1"}),done);
			  });
			});
			describe('PATCH', function(){
			  it('should send no body with no header or param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1').send(rec).expect(200,"1",done);
			  });
			  it('should send body with no header but true param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1?sendObject=true').send(rec).expect(200,_.extend({},db.data("post",0),rec),done);
			  });
			  it('should send body with true header but no param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1').set("X-Booster-SendObject","true").send(rec).expect(200,_.extend({},db.data("post",0),rec),done);
			  });
			  it('should send body with true header and true param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1?sendObject=true').set("X-Booster-SendObject","true").send(rec).expect(200,_.extend({},db.data("post",0),rec),done);
			  });
			  it('should send no body with true header and false param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1?sendObject=false').set("X-Booster-SendObject","true").send(rec).expect(200,"1",done);
			  });
			  it('should send body with false header and true param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1?sendObject=true').set("X-Booster-SendObject","false").send(rec).expect(200,_.extend({},db.data("post",0),rec),done);
			  });
			});
		});
		describe('init true', function(){
			beforeEach(function (done) {
				booster.init({db:db,app:app,sendObject:true});
				booster.resource('post');
				r = request(app);
				done();
			});
			describe('PUT', function(){
			  it('should send body with no header or param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1').send(rec).expect(200,_.extend(rec,{id:"1"}),done);
			  });
			  it('should send body with no header but true param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1?sendObject=true').send(rec).expect(200,_.extend(rec,{id:"1"}),done);
			  });
			  it('should send body with true header but no param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1').set("X-Booster-SendObject","true").send(rec).expect(200,_.extend(rec,{id:"1"}),done);
			  });
			  it('should send body with true header and true param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1?sendObject=true').set("X-Booster-SendObject","true").send(rec).expect(200,_.extend(rec,{id:"1"}),done);
			  });
			  it('should send no body with true header and false param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1?sendObject=false').set("X-Booster-SendObject","true").send(rec).expect(200,"1",done);
			  });
			  it('should send body with false header and true param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1?sendObject=true').set("X-Booster-SendObject","false").send(rec).expect(200,_.extend(rec,{id:"1"}),done);
			  });
			});
			describe('PATCH', function(){
			  it('should send body with no header or param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1').send(rec).expect(200,_.extend({},db.data("post",0),rec),done);
			  });
			  it('should send body with no header but true param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1?sendObject=true').send(rec).expect(200,_.extend({},db.data("post",0),rec),done);
			  });
			  it('should send body with true header but no param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1').set("X-Booster-SendObject","true").send(rec).expect(200,_.extend({},db.data("post",0),rec),done);
			  });
			  it('should send body with true header and true param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1?sendObject=true').set("X-Booster-SendObject","true").send(rec).expect(200,_.extend({},db.data("post",0),rec),done);
			  });
			  it('should send no body with true header and false param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1?sendObject=false').set("X-Booster-SendObject","true").send(rec).expect(200,"1",done);
			  });
			  it('should send body with false header and true param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1?sendObject=true').set("X-Booster-SendObject","false").send(rec).expect(200,_.extend({},db.data("post",0),rec),done);
			  });
			});
		});
		describe('init false', function(){
			beforeEach(function (done) {
				booster.init({db:db,app:app,sendObject:false});
				booster.resource('post');
				r = request(app);
				done();
			});
			describe('PUT', function(){
			  it('should send no body with no header or param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1').send(rec).expect(200,"1",done);
			  });
			  it('should send body with no header but true param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1?sendObject=true').send(rec).expect(200,_.extend(rec,{id:"1"}),done);
			  });
			  it('should send body with true header but no param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1').set("X-Booster-SendObject","true").send(rec).expect(200,_.extend(rec,{id:"1"}),done);
			  });
			  it('should send body with true header and true param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1?sendObject=true').set("X-Booster-SendObject","true").send(rec).expect(200,_.extend(rec,{id:"1"}),done);
			  });
			  it('should send no body with true header and false param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1?sendObject=false').set("X-Booster-SendObject","true").send(rec).expect(200,"1",done);
			  });
			  it('should send body with false header and true param', function(done){
					var rec = {title:"nowfoo"};
					r.put('/post/1?sendObject=true').set("X-Booster-SendObject","false").send(rec).expect(200,_.extend(rec,{id:"1"}),done);
			  });
			});
			describe('PATCH', function(){
			  it('should send no body with no header or param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1').send(rec).expect(200,"1",done);
			  });
			  it('should send body with no header but true param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1?sendObject=true').send(rec).expect(200,_.extend({},db.data("post",0),rec),done);
			  });
			  it('should send body with true header but no param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1').set("X-Booster-SendObject","true").send(rec).expect(200,_.extend({},db.data("post",0),rec),done);
			  });
			  it('should send body with true header and true param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1?sendObject=true').set("X-Booster-SendObject","true").send(rec).expect(200,_.extend({},db.data("post",0),rec),done);
			  });
			  it('should send no body with true header and false param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1?sendObject=false').set("X-Booster-SendObject","true").send(rec).expect(200,"1",done);
			  });
			  it('should send body with false header and true param', function(done){
					var rec = {title:"nowfoo"};
					r.patch('/post/1?sendObject=true').set("X-Booster-SendObject","false").send(rec).expect(200,_.extend({},db.data("post",0),rec),done);
			  });
			});
		});
	});			
	describe('single path with different name', function(){
		beforeEach(function (done) {
			booster.init({db:db,app:app});
			booster.resource('post',{name:"poster"});
			r = request(app);
			done();
		});
		it('should map LIST',function (done) {
			r.get('/poster').expect(200,done);
		});
		it('should map GET',function (done) {
			r.get('/poster/1').expect(200,db.data("post",0)).end(done);
		});
		it('should map PUT',function (done) {
			var rec = {title:"a title",content:"nowfoo"};
			async.series([
				function (cb) {r.put('/poster/1').send(rec).expect(200,cb);},
				function (cb) {r.get('/poster/1').expect(200,_.extend({},db.data("post",0),rec),cb);}
			],done);
		});
		it('should map PATCH',function (done) {
			var rec = {content:"nowfoo"};
			async.series([
				function (cb) {r.patch('/poster/1').send(rec).expect(200,cb);},
				function (cb) {r.get('/poster/1').expect(200,_.extend({},db.data("post",0),rec),cb);}
			],done);
		});
		it('should map POST',function (done) {
			var newrec = {content:"new content",title:"Fancy Title"};
			async.waterfall([
				function (cb) {r.post('/poster').send(newrec).expect(201,cb);},
				function (res,cb) {r.get('/poster/'+res.text).expect(200,_.extend({},newrec,{id:res.text}),cb);}
			],done);
		});
		it('should map DELETE',function (done) {
			async.series([
				function (cb) {r.del('/poster/1').expect(204,cb);},
				function (cb) {r.get('/poster/1').expect(404,cb);}
			],done);
		});
	});
	describe('with multiple exception', function(){
		beforeEach(function (done) {
			booster.init({db:db,app:app});
			booster.resource('post',{except:["index","show"]});
			r = request(app);
			done();
		});
		it('should remove LIST',function (done) {
			r.get('/post').expect(404,done);
		});
		it('should remove GET',function (done) {
			r.get('/post/1').expect(404).end(done);
		});
		it('should map PUT',function (done) {
			var rec = {title:"new title",content:"new content"};
			async.series([
				function (cb) {r.put('/post/1').send(rec).expect(200,cb);},
				function (cb) {db.data("post","1").should.eql(_.extend({},db.data("post","1"),rec));cb();}
			],done);
		});
		it('should map PATCH',function (done) {
			var rec = {content:"new content"};
			async.series([
				function (cb) {r.patch('/post/1').send(rec).expect(200,cb);},
				function (cb) {db.data("post","1").should.eql(_.extend({},db.data("post","1"),rec));cb();}
			],done);
		});
		it('should map POST',function (done) {
			var newrec = {content:"some content",title:"a title"};
			async.waterfall([
				function (cb) {r.post('/post').send(newrec).expect(201,cb);},
				function (res,cb) {db.data("post",res.text).should.eql(_.extend({},newrec,{id:res.text}));cb();}
			],done);
		});
		it('should map DELETE',function (done) {
			async.series([
				function (cb) {r.del('/post/1').expect(204,cb);},
				function (cb) {r.get('/post/1').expect(404,cb);}
			],done);
		});
	});
	describe('with single exception', function(){
		beforeEach(function (done) {
			booster.init({db:db,app:app});
			booster.resource('post',{except:"index"});
			r = request(app);
			done();
		});
		it('should remove LIST',function (done) {
			r.get('/post').expect(404,done);
		});
		it('should map GET',function (done) {
			r.get('/post/1').expect(200,db.data("post",0)).end(done);
		});
		it('should map PUT',function (done) {
			var rec = {title:"a title",content:"nowfoo"};
			async.series([
				function (cb) {r.put('/post/1').send(rec).expect(200,cb);},
				function (cb) {r.get('/post/1').expect(200,_.extend({},db.data("post",0),rec),cb);}
			],done);
		});
		it('should map PATCH',function (done) {
			var rec = {content:"nowfoo"};
			async.series([
				function (cb) {r.patch('/post/1').send(rec).expect(200,cb);},
				function (cb) {r.get('/post/1').expect(200,_.extend({},db.data("post",0),rec),cb);}
			],done);
		});
		it('should map POST',function (done) {
			var newrec = {content:"new content",title:"Fancy Title"};
			async.waterfall([
				function (cb) {r.post('/post').send(newrec).expect(201,cb);},
				function (res,cb) {r.get('/post/'+res.text).expect(200,_.extend({},newrec,{id:res.text}),cb);}
			],done);
		});
		it('should map DELETE',function (done) {
			async.series([
				function (cb) {r.del('/post/1').expect(204,cb);},
				function (cb) {r.get('/post/1').expect(404,cb);}
			],done);
		});
	});
	describe('with multiple only-rules', function(){
		beforeEach(function (done) {
			booster.init({db:db,app:app});
			booster.resource('post',{only:["index","show"]});
			r = request(app);
			done();
		});
		it('should remove POST',function (done) {
			r.post('/post').expect(404,done);
		});
		it('should remove PATCH',function (done) {
			r.patch('/post/1').expect(404).end(done);
		});
		it('should remove PUT',function (done) {
			r.put('/post/1').expect(404).end(done);
		});
		it('should remove DELETE',function (done) {
			r.put('/post/1').expect(404).end(done);
		});
		it('should map GET index',function (done) {
			r.get('/post').expect(200,db.data("post"),done);
		});
		it('should map GET show',function (done) {
			r.get('/post/1').expect(200,db.data("post",0),done);
		});
	});
	describe('with single only-rules', function(){
		beforeEach(function (done) {
			booster.init({db:db,app:app});
			booster.resource('post',{only:"index"});
			r = request(app);
			done();
		});
		it('should remove POST',function (done) {
			r.post('/post').expect(404,done);
		});
		it('should remove PATCH',function (done) {
			r.patch('/post/1').expect(404).end(done);
		});
		it('should remove PUT',function (done) {
			r.put('/post/1').expect(404).end(done);
		});
		it('should remove DELETE',function (done) {
			r.put('/post/1').expect(404).end(done);
		});
		it('should remove GET show',function (done) {
			r.get('/post/1').expect(404,done);
		});
		it('should map GET index',function (done) {
			r.get('/post').expect(200,db.data("post"),done);
		});
	});
	describe('with except and only', function(){
		beforeEach(function (done) {
			booster.init({db:db,app:app});
			booster.resource('post',{only:"index",except:"post"});
			r = request(app);
			done();
		});			  
		it('should remove POST',function (done) {
			r.post('/post').expect(404,done);
		});
		it('should remove PATCH',function (done) {
			r.patch('/post/1').expect(404).end(done);
		});
		it('should remove PUT',function (done) {
			r.put('/post/1').expect(404).end(done);
		});
		it('should remove DELETE',function (done) {
			r.put('/post/1').expect(404).end(done);
		});
		it('should remove GET show',function (done) {
			r.get('/post/1').expect(404,done);
		});
		it('should map GET index',function (done) {
			r.get('/post').expect(200,db.data("post"),done);
		});
	});
	describe('resource as property', function(){
		describe('regular', function(){
			beforeEach(function (done) {
				booster.init({db:db,app:app});
				booster.resource('post',{resource:{comment:["get","set"]}});
				booster.resource('comment');
				r = request(app);
				done();
			});
			it('should map LIST',function (done) {
				r.get('/post').expect(200,db.data("post"),done);
			});
			it('should map GET',function (done) {
				r.get('/post/1').expect(200,db.data("post",0),done);
			});
			it('should GET resource as a property', function(done){
			  r.get('/post/1/comment').expect(200,db.data("comment",{post:"1"}),done);
			});
			it('should map SEARCH for exact match',function (done) {
				r.get('/post/1/comment').query({comment:"First comment on 1st post"}).expect(200,db.data("comment",{comment:"First comment on 1st post"})).end(done);
			});
			it('should map SEARCH for partial match',function (done) {
				r.get('/post/1/comment').query({comment:"irst comment on 1st",_text:true}).expect(200,db.data("comment",{comment:"First comment on 1st post"})).end(done);
			});
			it('should map SEARCH for ignore-case match',function (done) {
				r.get('/post/1/comment').query({comment:"irST commeNT on 1st",_text:true}).expect(200,db.data("comment",{comment:"First comment on 1st post"})).end(done);
			});
			it('should return 404 for SEARCH without results',function (done) {
				r.get('/post/1/comment').query({comment:"ABCDEFG"}).expect(404,done);
			});
			it('should reject SET resource if the field for self is not the same as given ID', function(done){
				var rec = [{post:"1",comment:"First comment on 1st post"},{post:"2",comment:"Third comment on 1st post"}];
				r.put('/post/1/comment').send(rec).expect(400,"field post in records must equal path value",done);
			});
			it('should SET resource as a property', function(done){
				// original data - we want to keep one, add one, discard one
				//{id:"1",post:"1",comment:"First comment on 1st post"},
				//{id:"2",post:"1",comment:"Second comment on 1st post"},
				var rec = [{post:"1",comment:"First comment on 1st post"},{post:"1",comment:"Third comment on 1st post"}],expect = [];
				expect.push(db.data("comment",rec[0])[0]);
				async.series([
					function (cb) {r.put('/post/1/comment').send(rec).expect(200,cb);},
					function (cb) {expect = [].concat(db.data("comment",rec[0])).concat(db.data("comment",rec[1]));cb();},
					function (cb) {r.get('/post/1/comment').expect(200,expect,cb);}
				],done);
			});
		});
		describe('pluralized', function(){
			describe('with singular property', function(){
				beforeEach(function (done) {
					booster.init({db:db,app:app});
					booster.resource('post',{pluralize:true,resource:{comment:["get","set"]}});
					booster.resource('comment');
					r = request(app);
					done();
				});
				it('should map LIST',function (done) {
					r.get('/posts').expect(200,db.data("post"),done);
				});
				it('should map GET',function (done) {
					r.get('/posts/1').expect(200,db.data("post",0),done);
				});
				it('should GET resource as a property', function(done){
				  r.get('/posts/1/comment').expect(200,db.data("comment",{post:"1"}),done);
				});
				it('should map SEARCH for exact match',function (done) {
					r.get('/posts/1/comment').query({comment:"First comment on 1st post"}).expect(200,db.data("comment",{comment:"First comment on 1st post"})).end(done);
				});
				it('should map SEARCH for partial match',function (done) {
					r.get('/posts/1/comment').query({comment:"irst comment on 1st",_text:true}).expect(200,db.data("comment",{comment:"First comment on 1st post"})).end(done);
				});
				it('should map SEARCH for ignore-case match',function (done) {
					r.get('/posts/1/comment').query({comment:"irST commeNT on 1st",_text:true}).expect(200,db.data("comment",{comment:"First comment on 1st post"})).end(done);
				});
				it('should return 404 for SEARCH without results',function (done) {
					r.get('/posts/1/comment').query({comment:"ABCDEFG"}).expect(404,done);
				});
				it('should reject SET resource if the field for self is not the same as given ID', function(done){
					var rec = [{post:"1",comment:"First comment on 1st post"},{post:"2",comment:"Third comment on 1st post"}];
					r.put('/posts/1/comment').send(rec).expect(400,"field post in records must equal path value",done);
				});
				it('should SET resource as a property', function(done){
					// original data - we want to keep one, add one, discard one
					//{id:"1",post:"1",comment:"First comment on 1st post"},
					//{id:"2",post:"1",comment:"Second comment on 1st post"},
					var rec = [{post:"1",comment:"First comment on 1st post"},{post:"1",comment:"Third comment on 1st post"}],expect = [];
					expect.push(db.data("comment",rec[0])[0]);
					async.series([
						function (cb) {r.put('/posts/1/comment').send(rec).expect(200,cb);},
						function (cb) {expect = [].concat(db.data("comment",rec[0])).concat(db.data("comment",rec[1]));cb();},
						function (cb) {r.get('/posts/1/comment').expect(200,expect,cb);}
					],done);
				});
			});
			describe('with pluralized property', function(){
				beforeEach(function (done) {
					booster.init({db:db,app:app});
					booster.resource('comment',{pluralize:true});
					booster.resource('post',{pluralize: true, resource:{comments:["get","set"]}});
					r = request(app);
					done();
				});
				it('should map LIST',function (done) {
					r.get('/posts').expect(200,db.data("post"),done);
				});
				it('should map GET',function (done) {
					r.get('/posts/1').expect(200,db.data("post",0),done);
				});
				it('should GET resource as a property', function(done){
				  r.get('/posts/1/comments').expect(200,db.data("comment",{post:"1"}),done);
				});
				it('should map SEARCH for exact match',function (done) {
					r.get('/posts/1/comments').query({comment:"First comment on 1st post"}).expect(200,db.data("comment",{comment:"First comment on 1st post"})).end(done);
				});
				it('should map SEARCH for partial match',function (done) {
					r.get('/posts/1/comments').query({comment:"irst comment on 1st",_text:true}).expect(200,db.data("comment",{comment:"First comment on 1st post"})).end(done);
				});
				it('should map SEARCH for ignore-case match',function (done) {
					r.get('/posts/1/comments').query({comment:"irST commeNT on 1st",_text:true}).expect(200,db.data("comment",{comment:"First comment on 1st post"})).end(done);
				});
				it('should return 404 for SEARCH without results',function (done) {
					r.get('/posts/1/comments').query({comment:"ABCDEFG"}).expect(404,done);
				});
				it('should reject SET resource if the field for self is not the same as given ID', function(done){
					var rec = [{post:"1",comment:"First comment on 1st post"},{post:"2",comment:"Third comment on 1st post"}];
					r.put('/posts/1/comments').send(rec).expect(400,"field post in records must equal path value",done);
				});
				it('should SET resource as a property', function(done){
					// original data - we want to keep one, add one, discard one
					//{id:"1",post:"1",comment:"First comment on 1st post"},
					//{id:"2",post:"1",comment:"Second comment on 1st post"},
					var rec = [{post:"1",comment:"First comment on 1st post"},{post:"1",comment:"Third comment on 1st post"}],expect = [];
					expect.push(db.data("comment",rec[0])[0]);
					async.series([
						function (cb) {r.put('/posts/1/comments').send(rec).expect(200,cb);},
						function (cb) {expect = [].concat(db.data("comment",rec[0])).concat(db.data("comment",rec[1]));cb();},
						function (cb) {r.get('/posts/1/comments').expect(200,expect,cb);}
					],done);
				});
			});
		});
	});
	describe('chaining', function(){
		beforeEach(function (done) {
			booster.init({db:db,app:app});
			booster.resource('post').resource('comment');
			r = request(app);
			done();
		});
		it('should map LIST post',function (done) {
			r.get('/post').expect(200,db.data("post"),done);
		});
		it('should map LIST comment',function (done) {
			r.get('/comment').expect(200,db.data("comment"),done);
		});
	});

	describe('multiple paths with different name', function(){
		beforeEach(function (done) {
			booster.init({db:db,app:app});
			booster.resource('post',{name:"poster"},{});
			r = request(app);
			done();
		});
		describe('unchanged path', function(){
			it('should map LIST',function (done) {
				r.get('/post').expect(200,done);
			});
			it('should map GET',function (done) {
				r.get('/post/1').expect(200,db.data("post",0)).end(done);
			});
			it('should map PUT',function (done) {
				var rec = {title:"a title",content:"nowfoo"};
				async.series([
					function (cb) {r.put('/post/1').send(rec).expect(200,cb);},
					function (cb) {r.get('/post/1').expect(200,_.extend({},db.data("post",0),rec),cb);}
				],done);
			});
			it('should map PATCH',function (done) {
				var rec = {content:"nowfoo"};
				async.series([
					function (cb) {r.patch('/post/1').send(rec).expect(200,cb);},
					function (cb) {r.get('/post/1').expect(200,_.extend({},db.data("post",0),rec),cb);}
				],done);
			});
			it('should map POST',function (done) {
				var newrec = {content:"new content",title:"Fancy Title"};
				async.waterfall([
					function (cb) {r.post('/post').send(newrec).expect(201,cb);},
					function (res,cb) {r.get('/post/'+res.text).expect(200,_.extend({},newrec,{id:res.text}),cb);}
				],done);
			});
			it('should map DELETE',function (done) {
				async.series([
					function (cb) {r.del('/post/1').expect(204,cb);},
					function (cb) {r.get('/post/1').expect(404,cb);}
				],done);
			});				
		});
		describe('changed path', function(){
			it('should map LIST',function (done) {
				r.get('/poster').expect(200,done);
			});
			it('should map GET',function (done) {
				r.get('/poster/1').expect(200,db.data("post",0)).end(done);
			});
			it('should map PUT',function (done) {
				var rec = {title:"a title",content:"nowfoo"};
				async.series([
					function (cb) {r.put('/poster/1').send(rec).expect(200,cb);},
					function (cb) {r.get('/poster/1').expect(200,_.extend({},db.data("post",0),rec),cb);}
				],done);
			});
			it('should map PATCH',function (done) {
				var rec = {content:"nowfoo"};
				async.series([
					function (cb) {r.patch('/poster/1').send(rec).expect(200,cb);},
					function (cb) {r.get('/poster/1').expect(200,_.extend({},db.data("post",0),rec),cb);}
				],done);
			});
			it('should map POST',function (done) {
				var newrec = {content:"new content",title:"Fancy Title"};
				async.waterfall([
					function (cb) {r.post('/poster').send(newrec).expect(201,cb);},
					function (res,cb) {r.get('/poster/'+res.text).expect(200,_.extend({},newrec,{id:res.text}),cb);}
				],done);
			});
			it('should map DELETE',function (done) {
				async.series([
					function (cb) {r.del('/poster/1').expect(204,cb);},
					function (cb) {r.get('/poster/1').expect(404,cb);}
				],done);
			});				
		});

	});
});
