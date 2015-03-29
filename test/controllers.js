/*global beforeEach,describe,it */
/*jslint node:true, debug:true, nomen:true */
/*jshint unused:vars */
var express = require('express'), _ = require('lodash'), request = require('supertest'), booster = require('../lib/booster'), 
async = require('async'), db = require('./resources/db'), bodyParser = require('body-parser');



// call the debugger in case we are in debug mode
describe('controllers',function () {
	var app, r;
	beforeEach(function(){
		db.reset();
		app = this.app = express();
		app.use(bodyParser.urlencoded({extended:true}));
		app.use(bodyParser.json());
	});
	describe('with controllers',function () {
		beforeEach(function (done) {
			booster.init({db:db,app:app,controllers:__dirname+'/resources/controllers',filters:__dirname+'/resources/filters'});
			booster.resource('post',{resource:{filter:["get"],processor:["get"]}});
			booster.resource('property');
			booster.resource('filter',{},{base:'/api',only:["index","show"]});
			booster.resource('processor',{},{base:'/api',only:["index","show"]});
			r = request(app);
			done();
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
					function (cb) {r.del('/post/1').expect(204,cb);},
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
			var path;
			describe('via base path', function(){
				beforeEach(function(){
					path = '/filter/1';
				});
			  it('should allow through request without block', function(done){
			    r.get(path).expect(200,db.data("filter",0),done);
			  });
			  it('should block the global one', function(done){
			    r.get(path).query({all:"all"}).expect(403,"all",done);
			  });
			  it('should block the filter.global one', function(done){
			    r.get(path).query({"filter.all":"filter.all"}).expect(403,"filter.all",done);
			  });
			  it('should block the show one', function(done){
			    r.get(path).query({"filter.show":"filter.show"}).expect(403,"filter.show",done);
			  });
				describe('in order', function(){
				  it('should use global with all three', function(done){
						var q = {"all":"all","filter.all":"filter.all","filter.show":"filter.show"};
				    r.get(path).query(q).expect(403,"all",done);
				  });
				  it('should use filter.global with last two', function(done){
						var q = {"filter.all":"filter.all","filter.show":"filter.show"};
				    r.get(path).query(q).expect(403,"filter.all",done);
				  });
				});
				describe('with only restriction', function(){
					describe('show', function(){
						beforeEach(function(){
							path = '/api/filter/1';
						});
					  it('should allow through request without block', function(done){
					    r.get(path).expect(200,db.data("filter",0),done);
					  });
					  it('should block the global one', function(done){
					    r.get(path).query({all:"all"}).expect(403,"all",done);
					  });
					  it('should block the filter.global one', function(done){
					    r.get(path).query({"filter.all":"filter.all"}).expect(403,"filter.all",done);
					  });
					  it('should block the show one', function(done){
					    r.get(path).query({"filter.show":"filter.show"}).expect(403,"filter.show",done);
					  });
					});
					describe('index', function(){
						beforeEach(function(){
							path = '/api/filter';
						});
					  it('should allow through request without block', function(done){
					    r.get(path).expect(200,db.data("filter"),done);
					  });
					  it('should block the global one', function(done){
					    r.get(path).query({all:"all"}).expect(403,"all",done);
					  });
					  it('should block the filter.global one', function(done){
					    r.get(path).query({"filter.all":"filter.all"}).expect(403,"filter.all",done);
					  });
					  it('should block the index one', function(done){
					    r.get(path).query({"filter.index":"filter.index"}).expect(403,"filter.index",done);
					  });
					});
				});
			});
			describe('via resource-as-a-property', function(){
				beforeEach(function(){
					path = '/post/1/filter';
				});
			  it('should allow through request without block', function(done){
			    r.get(path).expect(200,db.data("filter",{post:"1"}),done);
			  });
			  it('should block the global one', function(done){
			    r.get(path).query({all:"all"}).expect(403,"all",done);
			  });
			  it('should block the filter.global one', function(done){
			    r.get(path).query({"filter.all":"filter.all"}).expect(403,"filter.all",done);
			  });
			  it('should block the index one', function(done){
			    r.get(path).query({"filter.index":"filter.index"}).expect(403,"filter.index",done);
			  });
				describe('in order', function(){
				  it('should use global with all three', function(done){
						var q = {"all":"all","filter.all":"filter.all","filter.index":"filter.index"};
				    r.get(path).query(q).expect(403,"all",done);
				  });
				  it('should use filter.global with last two', function(done){
						var q = {"filter.all":"filter.all","filter.index":"filter.index"};
				    r.get(path).query(q).expect(403,"filter.all",done);
				  });
				});
			});
		});
		describe('global filters', function(){
		  it('should allow through request without block', function(done){
		    r.get('/filter/1').expect(200,db.data("filter",0),done);
		  });
		  it('should block the system.all one', function(done){
		    r.get('/filter/1').query({"system.all":"system.all"}).expect(403,"system.all",done);
		  });
		  it('should block the system.filter.all one', function(done){
		    r.get('/filter/1').query({"system.filter.all":"system.filter.all"}).expect(403,"system.filter.all",done);
		  });
		  it('should block the show one', function(done){
		    r.get('/filter/1').query({"system.filter.show":"system.filter.show"}).expect(403,"system.filter.show",done);
		  });
			describe('in order', function(){
			  it('should use system.global with all queries set', function(done){
					var q = {"system.all":"system.all","system.filter.all":"system.filter.all","system.filter.show":"system.filter.show",
						"all":"all","filter.all":"filter.all","filter.show":"filter.show"
				};
			    r.get('/filter/1').query(q).expect(403,"system.all",done);
			  });
			  it('should use system.filter.all with last two', function(done){
					var q = {"system.filter.all":"system.filter.all","filter.show":"filter.show"};
			    r.get('/filter/1').query(q).expect(403,"system.filter.all",done);
			  });
			});
		});
		describe('post processors', function(){
			describe('normal', function(){
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
				it('should run post.all() on resource-as-a-property getter', function(done){
					r.get('/post/1/processor').query({ptype:"all"}).expect("processor","all").end(done);
				});
				it('should run post.index() on resource-as-a-property getter', function(done){
					r.get('/post/1/processor').query({ptype:"index"}).expect("processor","index").end(done);
				});
			});
			describe('with only restriction', function(){
				it('should run the post.all() for index', function(done){
				  r.get('/api/processor').query({ptype:"all"}).expect("processor","all").expect(200,done);
				});
				it('should run the post.all() for show', function(done){
				  r.get('/api/processor/1').query({ptype:"all"}).expect("processor","all").expect(200,done);
				});
			});
		});
	});
});
