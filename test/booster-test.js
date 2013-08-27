/*global before,beforeEach,after,describe,it */
/*jslint node:true, debug:true, nomen:true */
var express = require('express'), _ = require('lodash'), request = require('supertest'), booster = require('../lib/booster'), 
async = require('async'), should = require('should'), db = require('./resources/db'), path;


// call the debugger in case we are in debug mode
before(function () {
	debugger;
});

// call the debugger in case we are in debug mode
describe('booster',function () {
	var app, r;
	describe('statics', function(){
		before(function (done) {
			db.reset();
			app = this.app = express();
			app.use(express.bodyParser());
			booster.init({db:db,app:app,models:__dirname+'/resources/models'});
			booster.resource('extender');
			r = request(app);
			done();
		});
		it('should have controllers hash', function(){
		  booster.controllers.should.have.property('extender');
		});
		it('should have models hash', function(){
		  booster.models.should.have.property('extender');
		});
		it('should extend extender model to have function extra',function () {
			booster.models.extender.should.have.property("extra");
		});	  
		it('should have the extra on extender models as a function',function () {
			booster.models.extender.extra.should.be.a("function");
		});
		it('should return the correct element on the extra function', function(){
		  booster.models.extender.extra().should.equal("I am an extra function");
		});
	});
	describe('.resource(name)',function () {
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
					function (cb) {r.del('/1').expect(200,cb);},
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
					before(function (done) {
						db.reset();
						app = this.app = express();
						app.use(express.bodyParser());
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
							function (cb) {r.del(path+'/1').expect(200,cb);},
							function (cb) {r.get(path+'/1').expect(404,cb);}
						],done);
					});
					it('should 404 DELETE for absurd ID',function (done) {
						r.del(path+'/12345').expect(404).end(done);
					});		  
				});
				describe('with trailing slash', function(){
					before(function (done) {
						db.reset();
						app = this.app = express();
						app.use(express.bodyParser());
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
							function (cb) {r.del(path+'/1').expect(200,cb);},
							function (cb) {r.get(path+'/1').expect(404,cb);}
						],done);
					});
					it('should 404 DELETE for absurd ID',function (done) {
						r.del(path+'/12345').expect(404).end(done);
					});		  
				});
			});
			describe('global', function(){
				before(function (done) {
					db.reset();
					app = this.app = express();
					app.use(express.bodyParser());
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
						function (cb) {r.del(path+'/1').expect(200,cb);},
						function (cb) {r.get(path+'/1').expect(404,cb);}
					],done);
				});
				it('should 404 DELETE for absurd ID',function (done) {
					r.del(path+'/12345').expect(404).end(done);
				});
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
				booster.resource('nestRequire',{parent:'post',parentProperty:true});
				booster.resource('nestOptional',{parent:'post',parentProperty:true,parentDefault:true});
				r = request(app);
				done();
			});
			describe('regular', function(){
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
					var rec = {comment:"new comment"};
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
		});
		describe('with controllers',function () {
			before(function (done) {
				db.reset();
				app = this.app = express();
				app.use(express.bodyParser());
				booster.init({db:db,app:app,controllers:__dirname+'/resources/controllers'});
				booster.resource('post');
				booster.resource('property');
				booster.resource('filter');
				booster.resource('processor');
				r = request(app);
				done();
			});
			beforeEach(function () {
				db.reset();
			});
			describe('basic controller', function(){
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
				it('should map GET for existing property', function(done){
				  r.get('/post/1/title').expect(200,"foo",done);
				});
				it('should return 404 for GET for non-existent property', function(done){
				  r.get('/post/1/nothinghere').expect(404,done);
				});
				it('should accept PUT for non-existent property', function(done){
					async.waterfall([
						function (cb) {r.put('/post/1/nothinghere').type("text").send("foo").expect(200,cb);},
						function (res,cb) {r.get('/post/1/nothinghere').expect(200,"foo",cb);}
					],done);
				});
				it('should accept PUT for existing property', function(done){
					async.waterfall([
						function (cb) {r.put('/post/1/title').type('text').send("newtitle").expect(200,cb);},
						function (res,cb) {r.get('/post/1/title').expect(200,"newtitle",cb);}
					],done);
				});			  
			});
			describe('properties override', function(){
				it('should map GET for existing property', function(done){
				  r.get('/property/1/title').expect(200,"foo",done);
				});
				it('should return 404 for GET for non-existent property', function(done){
				  r.get('/property/1/nothinghere').expect(404,done);
				});
				it('should accept PUT for non-existent property', function(done){
					async.waterfall([
						function (cb) {r.put('/property/1/nothinghere').type("text").send("foo").expect(200,cb);},
						function (res,cb) {r.get('/property/1/nothinghere').expect(200,"foo",cb);}
					],done);
				});
				it('should accept PUT for existing property', function(done){
					async.waterfall([
						function (cb) {r.put('/property/1/title').type('text').send("newtitle").expect(200,cb);},
						function (res,cb) {r.get('/property/1/title').expect(200,"newtitle",cb);}
					],done);
				});
				it('should override GET for defined property', function(done){
				  r.get('/property/1/groups').expect(200,["1","2"],done);
				});
				it('should override PUT for defined property', function(done){
					async.series([
						function (cb) {r.put('/property/1/groups').type("json").send(["5","6"]).expect(200,cb);},
						function (cb) {r.get('/property/1/groups').expect(200,["5","6"],cb);}
					],done);
				});
				it('should override GET for defined property with GET only', function(done){
				  r.get('/property/1/roles').expect(200,["A","B"],done);
				});
				it('should default for PUT for defined property without PUT', function(done){
					async.series([
						function(cb){r.put('/property/1/roles').type("json").send(["X","Y"]).expect(200,cb);},
						function(cb){r.get('/property/1/roles').expect(200,["A","B"],cb);},
					],done);
				  
				});
				it('should default GET for defined property without GET only', function(done){
				  r.get('/property/1/strange').expect(404,done);
				});
				it('should override PUT for defined property with PUT only', function(done){
					async.series([
						function (cb) {r.put('/property/1/strange').type("json").send(["5","6"]).expect(200,cb);},
						function (cb) {r.get('/property/1/strange').expect(404,cb);}
					],done);
				});
			});
			describe('filters', function(){
			  it('should allow through request without block', function(done){
			    r.get('/filter/1').expect(200,db.data("filter",0),done);
			  });
			  it('should block the global one', function(done){
			    r.get('/filter/1').query({all:"all"}).expect(403,"all",done);
			  });
			  it('should block the filter.global one', function(done){
			    r.get('/filter/1').query({"filter.all":"filter.all"}).expect(403,"filter.all",done);
			  });
			  it('should block the show one', function(done){
			    r.get('/filter/1').query({"filter.show":"filter.show"}).expect(403,"filter.show",done);
			  });
				describe('in order', function(){
				  it('should use global with all three', function(done){
						var q = {"all":"all","filter.all":"filter.all","filter.show":"filter.show"};
				    r.get('/filter/1').query(q).expect(403,"all",done);
				  });
				  it('should use filter.global with last two', function(done){
						var q = {"filter.all":"filter.all","filter.show":"filter.show"};
				    r.get('/filter/1').query(q).expect(403,"filter.all",done);
				  });
				});
			});
			describe('post processors', function(){
				it('should run the post.all()', function(done){
				  r.get('/processor/1').query({ptype:"all"}).expect("processor","all").expect(200,done);
				});
				it('should run the specific post.create()', function(done){
				  r.post('/processor').query({ptype:"create"}).expect("processor","create").expect(201,done);
				});
				it('should change the response for PUT', function(done){
				  r.put('/processor/1').send({special:"data"}).expect(400,"changed",done);
				});
				it('should run post.all() before post.create()', function(done){
				  r.post('/processor').query({ptype:"both"}).expect("processor",'["all","create"]').expect(201,done);
				});
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
				booster.resource('avalidated');  // just like validated, but uses async validation functions
				booster.resource('singleunique'); // one unique field
				booster.resource('doubleunique'); // two independent unique field
				booster.resource('combounique'); // two independent unique field
				booster.model('only'); // just a model, no route
				r = request(app);
				done();
			});
			describe('just a model', function(){
			  it('should have the right "only" model', function(){
			    should.exist(booster.models.only);
			  });
				it('should not have the route', function(done){
				  r.get("/only").expect(404,done);
				});
			});
			describe('basic fields',function () {
				beforeEach(function(){
				  db.reset();
				});
				it('should fail to LIST with invalid record',function (done) {
					r.get('/post').expect(400,[{other:"unknownfield"}]).end(done);
				});
				it('should successfully GET valid record',function (done) {
					r.get('/post/1').expect(200,db.data("post",0)).end(done);
				});
				it('should return 404 when GET for absurd ID',function (done) {
					r.get('/post/12345').expect(404).end(done);
				});				
				it('should reject GET record with field not in defined fields',function (done) {
					r.get('/post/4').expect(400,[{ other: 'unknownfield' }]).end(done);
				});
				it('should accept PUT with valid fields',function (done) {
					var rec = {title:"nowfoo",content:"newcontent"};
					async.series([
						function (cb) {r.put('/post/1').send(rec).expect(200,cb);},
						function (cb) {r.get('/post/1').expect(200,_.extend({},db.data("post",0),rec),cb);}
					],done);
				});
				it('should reject PUT with invalid fields',function (done) {
					async.series([
						function (cb) {r.put('/post/1').send({other:"nowfoo",title:"newtitle",content:"newcontent"}).expect(400,{other:"unknownfield"},cb);},
						function (cb) {r.get('/post/1').expect(200,db.data("post",0),cb);}
					],done);
				});
				it('should reject PUT with missing fields',function (done) {
					var rec = {content:"nowfoo"};
					async.series([
						function (cb) {r.put('/post/1').send(rec).expect(400,{title:"required"},cb);},
						function (cb) {r.get('/post/1').expect(200,db.data("post",0),cb);}
					],done);
				});
				it('should reject PUT that attempts to change immutable field',function (done) {
					async.series([
						function (cb) {r.put('/post/1').send({id:"20",title:"newfoo"}).expect(400,{id:"immutable"},cb);},
						function (cb) {r.get('/post/1').expect(200,db.data("post",0),cb);}
					],done);
				});
				it('should accept PATCH with missing fields',function (done) {
					var rec = {content:"newfoo"};
					async.series([
						function (cb) {r.patch('/post/1').send(rec).expect(200,cb);},
						function (cb) {r.get('/post/1').expect(200,_.extend({},db.data("post",0),rec),cb);}
					],done);
				});
				it('should reject PATCH that attempts to change immutable field',function (done) {
					async.series([
						function (cb) {r.patch('/post/1').send({id:"20"}).expect(400,{id:"immutable"},cb);},
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
				it('should reject POST with missing fields',function (done) {
					var newpost = {content:"foo content"};
					r.post('/post').send(newpost).expect(400,{title:"required"},done);
				});
				it('should map GET for existing property', function(done){
				  r.get('/post/1/title').expect(200,"foo",done);
				});
				it('should return 404 for GET for non-existent property', function(done){
				  r.get('/post/1/nothinghere').expect(404,done);
				});
				it('should reject PUT for non-existent property', function(done){
					r.put('/post/1/nothinghere').type("text").send("foo").expect(404,done);
				});
				it('should accept PUT for existing property', function(done){
					async.waterfall([
						function (cb) {r.put('/post/1/title').type('text').send("newtitle").expect(200,cb);},
						function (res,cb) {r.get('/post/1/title').expect(200,"newtitle",cb);}
					],done);
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
					var rec = {comment:"nowfoo"};
					async.series([
						function (cb) {r.put('/different/1').send(rec).expect(200,cb);},
						function (cb) {r.get('/different/1').expect(200,_.extend({},rec,{key:"1"}),cb);}
					],done);
				});
				it('should map PATCH',function (done) {
					var rec = {comment:"nowfoo"};
					async.series([
						function (cb) {r.patch('/different/1').send(rec).expect(200,cb);},
						function (cb) {r.get('/different/1').expect(200,_.extend({},db.data("different",0),rec),cb);}
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
				var table, data, privatedata, publicdata;
				before(function(){
					table = "user";
					data = db.data(table);
					privatedata = db.data("privateuser");
					publicdata = db.data("publicuser");
				});
				describe('direct API', function(){
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
				describe('via controllers', function(){
					describe('for a LIST',function () {
						it('should get public data only without _csview', function(done){
							r.get('/user').expect(200,publicdata).end(done);
						});
						it('should get private data with _csview=private', function(done){
							r.get('/user').query({_csview:"private"}).expect(200,privatedata).end(done);
						});
						it('should reject request with _csview=secret', function(done){
							r.get('/user').query({_csview:"secret"}).expect(400).end(done);
						});
					});
					describe('for a GET', function(){
						it('should get public data only without _csview', function(done){
							r.get('/user/1').expect(200,publicdata[0]).end(done);
						});
						it('should get private data with _csview=private', function(done){
							r.get('/user/1').query({_csview:"private"}).expect(200,privatedata[0]).end(done);
						});
						it('should reject request with _csview=secret', function(done){
							r.get('/user/1').query({_csview:"secret"}).expect(400).end(done);
						});
					});
				  
				});
			});
			describe('with validations', function(){
				var name, table;
				describe('synchronous', function(){
				  before(function(){
				    table = name = "validated";
				  });
					it('should fail to LIST with invalid record',function (done) {
						r.get('/'+name).expect(400,[{email:"email",alpha:"alphanumeric",abc:"invalid"}]).end(done);
					});
					it('should successfully GET valid record',function (done) {
						r.get('/'+name+'/1').expect(200,db.data(table,0)).end(done);
					});
					it('should reject GET record with invalid fields',function (done) {
						r.get('/'+name+'/2').expect(400,[{email:"email",alpha:"alphanumeric",abc:"invalid"}]).end(done);
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
					it('should accept PUT with valid fields and other optional data',function (done) {
						// optional alpha and email fields should not be returned after PUT
						var newinfo = {def:"def",abc:"abc"}, oldinfo = db.data(table,0);
						async.series([
							function (cb) {r.put('/'+name+'/1').send(newinfo).expect(200,cb);},
							function (cb) {r.get('/'+name+'/1').expect(200,_.extend({},newinfo,{def:"fed",id:oldinfo.id}),cb);}
						],done);
					});
				});
				describe('asynchronous', function(){
				  before(function(){
				    table = name = "avalidated";
				  });
					it('should fail to LIST with invalid record',function (done) {
						r.get('/'+name).expect(400,[{email:"email",alpha:"alphanumeric",abc:"invalid"}]).end(done);
					});
					it('should successfully GET valid record',function (done) {
						r.get('/'+name+'/1').expect(200,db.data(table,0)).end(done);
					});
					it('should reject GET record with invalid fields',function (done) {
						r.get('/'+name+'/2').expect(400,[{email:"email",alpha:"alphanumeric",abc:"invalid"}]).end(done);
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
			describe('with unique fields', function(){
			  describe('single unique field', function(){
					beforeEach(function(){
					  db.reset();
					});
			    it('should reject create with conflict', function(done){
			      r.post('/singleunique').type('json').send({firstname:"steve",lastname:"smith"}).expect(409,done);
			    });
					it('should accept create with no conflict', function(done){
			      r.post('/singleunique').type('json').send({firstname:"steve",lastname:"jackson"}).expect(201,done);
					});
					it('should reject update with conflict', function(done){
			      r.put('/singleunique/1').type('json').send({firstname:"samantha",lastname:"jones"}).expect(409,done);
					});
					it('should accept update with no conflict', function(done){
			      r.put('/singleunique/1').type('json').send({firstname:"samantha",lastname:"stevenson"}).expect(200,done);
					});
					it('should reject patch with conflict', function(done){
			      r.patch('/singleunique/1').type('json').send({lastname:"jones"}).expect(409,done);
					});
					it('should accept patch with no conflict', function(done){
			      r.patch('/singleunique/1').type('json').send({lastname:"stevenson"}).expect(200,done);
					});
			  });
				describe('multiple unique fields', function(){
					beforeEach(function(){
					  db.reset();
					});
			    it('should reject create with first field conflict', function(done){
			      r.post('/doubleunique').type('json').send({firstname:"steve",lastname:"smith"}).expect(409,done);
			    });
			    it('should reject create with other field conflict', function(done){
			      r.post('/doubleunique').type('json').send({firstname:"jill",lastname:"stevenson"}).expect(409,done);
			    });
			    it('should reject create with both fields conflict', function(done){
			      r.post('/doubleunique').type('json').send({firstname:"jill",lastname:"smith"}).expect(409,done);
			    });
					it('should accept create with no conflict', function(done){
			      r.post('/doubleunique').type('json').send({firstname:"steve",lastname:"stevenson"}).expect(201,done);
					});
					it('should reject update with first field conflict', function(done){
			      r.put('/doubleunique/1').type('json').send({firstname:"steve",lastname:"jones"}).expect(409,done);
					});
					it('should reject update with other field conflict', function(done){
			      r.put('/doubleunique/1').type('json').send({firstname:"jill",lastname:"stevenson"}).expect(409,done);
					});
					it('should reject update with both field conflict', function(done){
			      r.put('/doubleunique/1').type('json').send({firstname:"jill",lastname:"jones"}).expect(409,done);
					});
					it('should accept update with no conflict', function(done){
			      r.put('/doubleunique/1').type('json').send({firstname:"steve",lastname:"stevenson"}).expect(200,done);
					});
					it('should reject patch with first field conflict', function(done){
			      r.patch('/doubleunique/1').type('json').send({lastname:"jones"}).expect(409,done);
					});
					it('should reject patch with other field conflict', function(done){
			      r.patch('/doubleunique/1').type('json').send({firstname:"jill"}).expect(409,done);
					});
					it('should reject patch with both field conflict', function(done){
			      r.patch('/doubleunique/1').type('json').send({firstname:"jill",lastname:"jones"}).expect(409,done);
					});
					it('should accept patch with no conflict', function(done){
			      r.patch('/doubleunique/1').type('json').send({firstname:"steve",lastname:"stevenson"}).expect(200,done);
					});
				});
				describe('combination unique fields', function(){
					beforeEach(function(){
					  db.reset();
					});
			    it('should reject create with both fields conflict', function(done){
			      r.post('/combounique').type('json').send({firstname:"sam",lastname:"smith"}).expect(409,done);
			    });
					it('should accept create with first field conflict', function(done){
			      r.post('/combounique').type('json').send({firstname:"sam",lastname:"stevenson"}).expect(201,done);
					});
					it('should accept create with other field conflict', function(done){
			      r.post('/combounique').type('json').send({firstname:"steve",lastname:"smith"}).expect(201,done);
					});
					it('should accept create with no conflict', function(done){
			      r.post('/combounique').type('json').send({firstname:"steve",lastname:"stevenson"}).expect(201,done);
					});
			    it('should reject update with both fields conflict', function(done){
			      r.put('/combounique/1').type('json').send({firstname:"jill",lastname:"jones"}).expect(409,done);
			    });
					it('should accept update with first field conflict', function(done){
			      r.put('/combounique/1').type('json').send({firstname:"jill",lastname:"stevenson"}).expect(200,done);
					});
					it('should accept update with other field conflict', function(done){
			      r.put('/combounique/1').type('json').send({firstname:"steve",lastname:"jones"}).expect(200,done);
					});
					it('should accept update with no conflict', function(done){
			      r.put('/combounique/1').type('json').send({firstname:"steve",lastname:"stevenson"}).expect(200,done);
					});
			    it('should reject patch with both fields conflict', function(done){
			      r.patch('/combounique/1').type('json').send({firstname:"jill",lastname:"jones"}).expect(409,done);
			    });
					it('should accept patch with first field conflict', function(done){
			      r.patch('/combounique/1').type('json').send({firstname:"jill"}).expect(200,done);
					});
					it('should accept patch with other field conflict', function(done){
			      r.patch('/combounique/1').type('json').send({lastname:"jones"}).expect(200,done);
					});
					it('should accept patch with no conflict', function(done){
			      r.patch('/combounique/1').type('json').send({lastname:"stevenson"}).expect(200,done);
					});
				});
			});
		});
	});
	describe('general route', function(){
		before(function (done) {
			db.reset();
			app = this.app = express();
			app.use(express.bodyParser());
			booster.init({db:db,app:app});
			booster.resource('post');
			app.get('/booster',function (req,res,next) {
				if (req.booster) {
					res.send(200,req.booster);
				} else {
					res.send(404);
				}
			});
			r = request(app);
			done();
		});
	  it('should have access to req.booster on non-booster route', function(done){
	    r.get('/booster').expect(200,{param:{},models:{post:{}},controllers:{post:{}}},done);
	  });
	});
});
