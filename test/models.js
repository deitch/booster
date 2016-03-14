/*global before,beforeEach,describe,it */
/*jslint node:true, debug:true, nomen:true,expr:true */
/*jshint unused:vars */
var express = require('express'), _ = require('lodash'), request = require('supertest'), booster = require('../lib/booster'), 
async = require('async'), should = require('should'), db = require('./resources/db'), bodyParser = require('body-parser');



// call the debugger in case we are in debug mode
describe('models',function () {
	var app, r;
	beforeEach(function(){
		db.reset();
		app = this.app = express();
		app.use(bodyParser.urlencoded({extended:true}));
		app.use(bodyParser.json());
	});
	beforeEach(function (done) {
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
		booster.resource('uniquesuppress'); // unique field, but suppress the error
		booster.resource('integers'); // fields with integers
		booster.resource('defaultfilter'); // field with a default filter
		booster.resource('withdefault'); // field with a default for blank
		booster.resource('cascadeone'); // parent of cascade
		booster.resource('cascadetwo'); // child of cascade
		booster.resource('cascadethree'); // grandchild of cascade
		booster.resource('cascadefour'); // other child of cascade
		booster.resource('cascadefilter'); // child of cascade with default filter
		booster.resource('validatetoparent'); // fields that depend on parent validation
		booster.resource('validateparent'); // parent for validation
		booster.resource('deleteparentallow'); // parent for delete policies
		booster.resource('deleteparentprevent'); // parent for delete policies
		booster.resource('deleteparentpreventfield'); // parent for delete policies with different named field
		booster.resource('deleteparentforce'); // parent for delete policies
		booster.resource('deleteparentcascade'); // parent for delete policies
		booster.resource('deleteparentcascade_childallow'); // parent for delete policies
		booster.resource('deleteparentcascade_childprevent'); // parent for delete policies
		booster.resource('deleteparentcascade_childforce'); // parent for delete policies
		booster.resource('deleteparentcascade_childcascade'); // parent for delete policies
		booster.resource('deletechild'); // child for delete policies
		booster.resource('deletechildprevent'); // child for delete policies
		booster.resource('deletechildforce'); // child for delete policies
		booster.resource('deletechildallow'); // child for delete policies
		booster.resource('deletechildcascade'); // child for delete policies
		booster.resource('deletegrandchild'); // grandchild for delete policies
		booster.model('deletepreventself'); // prevents deletion of self
		booster.model('bfields'); // with $b fields that should skip validation but go to filters and post-processors
		booster.model('only'); // just a model, no route
		booster.model('modelfilter'); // just a model to test model filtering
		booster.model('modelpost'); // just a model to test model post processing
		booster.model('modeldoublepost'); // just a model to test create post processor that calls another create
		booster.model('boolean'); // fields with boolean, to test search conversion
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
			r.get('/post/4').expect(400,{ other: 'unknownfield' }).end(done);
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
				function (cb) {r.del('/different/1').expect(204,cb);},
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
				function (cb) {r.del('/'+resource+'/1').expect(204,cb);},
				function (cb) {r.get('/'+resource+'/1').expect(404,cb);}
			],done);
		});
		it('should 404 DELETE for absurd ID',function (done) {
			r.del('/'+resource+'/12345').expect(404).end(done);
		});			
	});
	describe('with different visibility fields', function(){
		var table, data, privatedata, publicdata;
		beforeEach(function(){
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
				it('should get public data only without csview', function(done){
					r.get('/user').expect(200,publicdata).end(done);
				});
				it('should get private data with csview=private', function(done){
					r.get('/user').query({'$b.csview':"private"}).expect(200,privatedata).end(done);
				});
				it('should reject request with csview=secret', function(done){
					r.get('/user').query({'$b.csview':"secret"}).expect(400).end(done);
				});
			});
			describe('for a GET', function(){
				it('should get public data only without csview', function(done){
					r.get('/user/1').expect(200,publicdata[0]).end(done);
				});
				it('should get private data with csview=private', function(done){
					r.get('/user/1').query({'$b.csview':"private"}).expect(200,privatedata[0]).end(done);
				});
				it('should reject request with csview=secret', function(done){
					r.get('/user/1').query({'$b.csview':"secret"}).expect(400).end(done);
				});
			});
	  
		});
	});
	describe('with validations', function(){
		var name, table;
		describe('synchronous', function(){
		  beforeEach(function(){
		    table = name = "validated";
		  });
			it('should fail to LIST with invalid record',function (done) {
				r.get('/'+name).expect(400,[{email:"email",alpha:"alphanumeric",abc:"invalid",list:"list:a,b,c"}]).end(done);
			});
			it('should successfully GET valid record',function (done) {
				r.get('/'+name+'/1').expect(200,db.data(table,0)).end(done);
			});
			it('should reject GET record with invalid fields',function (done) {
				r.get('/'+name+'/2').expect(400,{email:"email",alpha:"alphanumeric",abc:"invalid",list:"list:a,b,c"}).end(done);
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
			it('should accept PUT with valid object field', function(done){
				var newdata = {alphaobj:"bigAl"};
				async.series([
					function (cb) {r.put('/'+name+'/1').send(newdata).expect(200,cb);},
					function (cb) {r.get('/'+name+'/1').expect(200,_.extend({},db.data(table,0),newdata),cb);}
				],done);
			});
			it('should accept PATCH with valid object field', function(done){
				var newdata = {alphaobj:"bigAl"};
				async.series([
					function (cb) {r.patch('/'+name+'/1').send(newdata).expect(200,cb);},
					function (cb) {r.get('/'+name+'/1').expect(200,_.extend({},db.data(table,0),newdata),cb);}
				],done);
			});
			it('should reject PUT with invalid object field', function(done){
				r.put('/'+name+'/1').send({alphaobj:"not ! alpha"}).expect(400,{alphaobj:"alphanumeric"},done);
			});
			it('should reject PATCH with invalid object field', function(done){
				r.patch('/'+name+'/1').send({alphaobj:"not ! alpha"}).expect(400,{alphaobj:"alphanumeric"},done);
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
			it('should reject POST with invalid list field', function(done){
				r.post('/'+name).send({list:"q"}).expect(400,{list:"list:a,b,c"},done);
			});
			it('should reject PUT with invalid list field', function(done){
				r.put('/'+name+'/2').send({list:"q"}).expect(400,{list:"list:a,b,c"},done);
			});
			it('should reject PATCH with invalid list field', function(done){
				r.patch('/'+name+'/2').send({list:"q"}).expect(400,{list:"list:a,b,c"},done);
			});
			it('should accept POST with valid list field', function(done){
				r.post('/'+name).send({list:"a"}).expect(201,done);
			});
			it('should accept PUT with valid list field', function(done){
				r.put('/'+name+'/2').send({list:"a"}).expect(200,done);
			});
			it('should accept PATCH with valid list field', function(done){
				r.patch('/'+name+'/2').send({list:"a"}).expect(200,done);
			});
			describe('numbers', function(){
				it('should reject POST with string for integer field', function(done){
					r.post('/'+name).send({int:"2"}).expect(400,{int:"integer"},done);
				});
				it('should reject PUT with string for integer field ', function(done){
					r.put('/'+name+'/2').send({int:"2"}).expect(400,{int:"integer"},done);
				});
				it('should reject PATCH with string for integer field ', function(done){
					r.patch('/'+name+'/2').send({int:"2"}).expect(400,{int:"integer"},done);
				});
				it('should accept POST with integer for integer field', function(done){
					r.post('/'+name).send({int:2}).expect(201,done);
				});
				it('should accept PUT with integer for integer field', function(done){
					r.put('/'+name+'/2').send({int:2}).expect(200,done);
				});
				it('should accept PATCH with integer for integer field', function(done){
					r.patch('/'+name+'/2').send({int:2}).expect(200,done);
				});
			});
		});
		describe('asynchronous', function(){
		  beforeEach(function(){
		    table = name = "avalidated";
		  });
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
	describe('with parent validations', function(){
		// remember, /validateparent/10 has everything "draft", /validateparent/20 has everything "published"
		describe('with no check restrictions', function(){
			it('should reject unmatched create', function(done){
				r.post('/validatetoparent').send({status:"published",validateparent:"10"}).expect(400,{status:"invalidparent"},done);
			});
			it('should reject unmatched PUT', function(done){
				r.put('/validatetoparent/1').send({status:"published",validateparent:"10"}).expect(400,{status:"invalidparent"},done);
			});
			it('should reject unmatched PATCH', function(done){
				r.patch('/validatetoparent/1').send({status:"published"}).expect(400,{status:"invalidparent"},done);
			});
			it('should accept matched create', function(done){
				r.post('/validatetoparent').send({status:"published",validateparent:"20"}).expect(201,done);
			});
			it('should accept matched PUT', function(done){
				r.put('/validatetoparent/2').send({status:"published",validateparent:"20"}).expect(200,done);
			});
			it('should accept PUT that removes parent', function(done){
				r.put('/validatetoparent/1').send({status:"published"}).expect(200,done);
			});
			it('should accept matched PATCH', function(done){
				r.patch('/validatetoparent/2').send({status:"published"}).expect(200,done);
			});
			it('should accept create without required parent', function(done){
				r.post('/validatetoparent').send({status:"published"}).expect(201,done);
			});
		});
		describe('with single check restriction', function(){
			it('should reject unmatched create', function(done){
				r.post('/validatetoparent').send({statuscheck:"published",validateparent:"10"}).expect(400,{statuscheck:"invalidparent"},done);
			});
			it('should reject unmatched PUT', function(done){
				r.put('/validatetoparent/1').send({statuscheck:"published",validateparent:"10"}).expect(400,{statuscheck:"invalidparent"},done);
			});
			it('should reject unmatched PATCH', function(done){
				r.patch('/validatetoparent/1').send({statuscheck:"published"}).expect(400,{statuscheck:"invalidparent"},done);
			});
			it('should accept matched create', function(done){
				r.post('/validatetoparent').send({statuscheck:"published",validateparent:"20"}).expect(201,done);
			});
			it('should accept matched PUT', function(done){
				r.put('/validatetoparent/2').send({statuscheck:"published",validateparent:"20"}).expect(200,done);
			});
			it('should accept matched PATCH', function(done){
				r.patch('/validatetoparent/2').send({statuscheck:"published"}).expect(200,done);
			});
			it('should accept create not in check list', function(done){
				r.post('/validatetoparent').send({statuscheck:"foo",validateparent:"20"}).expect(201,done);
			});
			it('should accept PUT not in check list', function(done){
				r.put('/validatetoparent/2').send({statuscheck:"foo",validateparent:"20"}).expect(200,done);
			});
			it('should accept PATCH not in check list', function(done){
				r.patch('/validatetoparent/2').send({statuscheck:"foo"}).expect(200,done);
			});
		});
		describe('with comma-separated restriction', function(){
			it('should reject unmatched create', function(done){
				r.post('/validatetoparent').send({statuscheckcomma:"published",validateparent:"10"}).expect(400,{statuscheckcomma:"invalidparent"},done);
			});
			it('should reject unmatched PUT', function(done){
				r.put('/validatetoparent/1').send({statuscheckcomma:"published",validateparent:"10"}).expect(400,{statuscheckcomma:"invalidparent"},done);
			});
			it('should reject unmatched PATCH', function(done){
				r.patch('/validatetoparent/1').send({statuscheckcomma:"published"}).expect(400,{statuscheckcomma:"invalidparent"},done);
			});
			it('should accept matched create', function(done){
				r.post('/validatetoparent').send({statuscheckcomma:"published",validateparent:"20"}).expect(201,done);
			});
			it('should accept matched PUT', function(done){
				r.put('/validatetoparent/2').send({statuscheckcomma:"published",validateparent:"20"}).expect(200,done);
			});
			it('should accept matched PATCH', function(done){
				r.patch('/validatetoparent/2').send({statuscheckcomma:"published"}).expect(200,done);
			});
			it('should accept create not in check list', function(done){
				r.post('/validatetoparent').send({statuscheckcomma:"foo",validateparent:"20"}).expect(201,done);
			});
			it('should accept PUT not in check list', function(done){
				r.put('/validatetoparent/2').send({statuscheckcomma:"foo",validateparent:"20"}).expect(200,done);
			});
			it('should accept PATCH not in check list', function(done){
				r.patch('/validatetoparent/2').send({statuscheckcomma:"foo"}).expect(200,done);
			});
		});
		describe('with array restriction', function(){
			it('should reject unmatched create', function(done){
				r.post('/validatetoparent').send({statuschecklist:"published",validateparent:"10"}).expect(400,{statuschecklist:"invalidparent"},done);
			});
			it('should reject unmatched PUT', function(done){
				r.put('/validatetoparent/1').send({statuschecklist:"published",validateparent:"10"}).expect(400,{statuschecklist:"invalidparent"},done);
			});
			it('should reject unmatched PATCH', function(done){
				r.patch('/validatetoparent/1').send({statuschecklist:"published"}).expect(400,{statuschecklist:"invalidparent"},done);
			});
			it('should accept matched create', function(done){
				r.post('/validatetoparent').send({statuschecklist:"published",validateparent:"20"}).expect(201,done);
			});
			it('should accept matched PUT', function(done){
				r.put('/validatetoparent/2').send({statuschecklist:"published",validateparent:"20"}).expect(200,done);
			});
			it('should accept matched PATCH', function(done){
				r.patch('/validatetoparent/2').send({statuschecklist:"published"}).expect(200,done);
			});
			it('should accept create not in check list', function(done){
				r.post('/validatetoparent').send({statuschecklist:"foo",validateparent:"20"}).expect(201,done);
			});
			it('should accept PUT not in check list', function(done){
				r.put('/validatetoparent/2').send({statuschecklist:"foo",validateparent:"20"}).expect(200,done);
			});
			it('should accept PATCH not in check list', function(done){
				r.patch('/validatetoparent/2').send({statuschecklist:"foo"}).expect(200,done);
			});
		});
		describe('with complex restriction', function(){
			describe('with star', function(done){
				it('should accept any create', function(){
					r.post('/validatetoparent').send({statuscheckcomplex:"draft",validateparent:"10"}).expect(201,done);
				});
				it('should accept any put', function(done){
					r.put('/validatetoparent/1').send({statuscheckcomplex:"draft",validateparent:"10"}).expect(200,done);
				});
				it('should accept any patch', function(done){
					r.patch('/validatetoparent/1').send({statuscheckcomplex:"draft"}).expect(200,done);
				});
			});
			describe('with no field', function(){
				it('should accept any create', function(done){
					r.post('/validatetoparent').send({statuscheckcomplex:"open",validateparent:"10"}).expect(201,done);
				});
				it('should accept any put', function(done){
					r.put('/validatetoparent/1').send({statuscheckcomplex:"open",validateparent:"10"}).expect(200,done);
				});
				it('should accept any patch', function(done){
					r.patch('/validatetoparent/1').send({statuscheckcomplex:"open"}).expect(200,done);
				});
			});
			describe('with single string', function(){
				describe('unmatched', function(){
					beforeEach(function(done){
						r.patch('/validateparent/10').send({statuscheckcomplex:"draft"}).expect(200,done);
					});
					it('should reject unmatched create', function(done){
						r.post('/validatetoparent').send({statuscheckcomplex:"closed",validateparent:"10"}).expect(400,{statuscheckcomplex:"invalidparent"},done);
					});
					it('should reject unmatched put', function(done){
						r.put('/validatetoparent/1').send({statuscheckcomplex:"closed",validateparent:"10"}).expect(400,{statuscheckcomplex:"invalidparent"},done);
					});
					it('should reject unmatched patch', function(done){
						r.patch('/validatetoparent/1').send({statuscheckcomplex:"closed"}).expect(400,{statuscheckcomplex:"invalidparent"},done);
					});
				});
				describe('matched', function(){
					beforeEach(function(done){
						r.patch('/validateparent/10').send({statuscheckcomplex:"open"}).expect(200,done);
					});
					it('should accept matched create', function(done){
						r.post('/validatetoparent').send({statuscheckcomplex:"closed",validateparent:"10"}).expect(201,done);
					});
					it('should accept matched put', function(done){
						r.put('/validatetoparent/1').send({statuscheckcomplex:"closed",validateparent:"10"}).expect(200,done);
					});
					it('should accept matched patch', function(done){
						r.post('/validatetoparent').send({statuscheckcomplex:"closed",validateparent:"10"}).expect(201,done);
					});
				});
			});
			describe('with array', function(){
				describe('unmatched', function(){
					beforeEach(function(done){
						r.patch('/validateparent/10').send({statuscheckcomplex:"draft"}).expect(200,done);
					});
					it('should reject unmatched create', function(done){
						r.post('/validatetoparent').send({statuscheckcomplex:"published",validateparent:"10"}).expect(400,{statuscheckcomplex:"invalidparent"},done);
					});
					it('should reject unmatched put', function(done){
						r.put('/validatetoparent/1').send({statuscheckcomplex:"published",validateparent:"10"}).expect(400,{statuscheckcomplex:"invalidparent"},done);
					});
					it('should reject unmatched patch', function(done){
						r.patch('/validatetoparent/1').send({statuscheckcomplex:"published"}).expect(400,{statuscheckcomplex:"invalidparent"},done);
					});
				});
				describe('matched', function(){
					beforeEach(function(done){
						r.patch('/validateparent/10').send({statuscheckcomplex:"open"}).expect(200,done);
					});
					it('should accept matched create', function(done){
						r.post('/validatetoparent').send({statuscheckcomplex:"published",validateparent:"10"}).expect(201,done);
					});
					it('should accept matched put', function(done){
						r.put('/validatetoparent/1').send({statuscheckcomplex:"published",validateparent:"10"}).expect(200,done);
					});
					it('should accept matched patch', function(done){
						r.post('/validatetoparent').send({statuscheckcomplex:"published",validateparent:"10"}).expect(201,done);
					});
				});
			});
		});
	});
	describe('delete policies', function(){
		describe('policy', function(){
			describe('allow', function(){
				it('should delete even with children', function(done){
					r.del('/deleteparentallow/100').expect(204,done);
				});
			});
			describe('prevent', function(){
				describe('without field', function(){
					it('should delete without children', function(done){
						r.del('/deleteparentprevent/20').expect(204,done);
					});
					it('should prevent delete if has children', function(done){
						r.del('/deleteparentprevent/10').expect(409,{delete:"children"},done);
					});
					it('should prevent delete even if force', function(done){
						r.del('/deleteparentprevent/10').query({force:true}).expect(409,{delete:"children"},done);
					});
				});
				describe('with field', function(){
					it('should delete without children', function(done){
						r.del('/deleteparentpreventfield/20').expect(204,done);
					});
					it('should prevent delete if has children', function(done){
						r.del('/deleteparentpreventfield/10').expect(409,{delete:"children"},done);
					});
					it('should prevent delete even if force', function(done){
						r.del('/deleteparentpreventfield/10').query({force:true}).expect(409,{delete:"children"},done);
					});
				});
			});
			describe('force', function(){
				it('should delete without children', function(done){
					r.del('/deleteparentforce/200').expect(204,done);
				});
				it('should prevent delete if has children', function(done){
					r.del('/deleteparentforce/210').expect(409,{delete:"children"},done);
				});
				it('should allow delete if force while keeping children', function(done){
					async.series([
						function (cb) {
							r.del('/deleteparentforce/210').query({force:true}).expect(204,cb);
						},
						function (cb) {
							r.get('/deletechild').query({deleteparentforce:'210'}).expect(200,cb);
						}
					],done);
				});
			});
			describe('cascade', function(){
				it('should delete without children', function(done){
					r.del('/deleteparentcascade/300').expect(204,done);
				});
				it('should delete including children', function(done){
					async.series([
						function (cb) {
							r.del('/deleteparentcascade/310').expect(204,cb);
						},
						function (cb) {
							r.get('/deletechild').query({deleteparentcascade:'310'}).expect(200,[],cb);
						}
					],done);
				});
				it('should prevent delete if have grandchildren and child policy is prevent', function(done){
					r.del('/deleteparentcascade_childprevent/320').expect(409,{delete:"children"},done);
				});
				it('should allow delete if have grandchildren and child policy is allow', function(done){
					async.series([
						function (cb) {
							r.del('/deleteparentcascade_childallow/340').expect(204,cb);
						},
						function (cb) {
							r.get('/deletechildallow').query({deleteparentcascade_childallow:"340"}).expect(200,[],cb);
						},
						function (cb) {
							r.get('/deletegrandchild').expect(200,[].concat(db.data("deletegrandchild",0)),cb);
						}
					],done);
				});
				it('should allow delete if have grandchildren and child policy is cascade', function(done){
					async.series([
						function (cb) {
							r.del('/deleteparentcascade_childcascade/350').expect(204,cb);
						},
						function (cb) {
							r.get('/deletechildcascade').query({deleteparentcascade_childcascade:"350"}).expect(200,[],cb);
						},
						function (cb) {
							r.get('/deletegrandchild').expect(200,[],cb);
						}
					],done);
				});
				it('should prevent delete if have grandchildren and child policy is force', function(done){
					r.del('/deleteparentcascade_childforce/330').expect(409,{delete:"children"},done);
				});
				it('should allow delete if have force and have grandchildren and child policy is force', function(done){
					async.series([
						function (cb) {
							r.del('/deleteparentcascade_childforce/330').query({force:true}).expect(204,cb);
						},
						function (cb) {
							r.get('/deletechildforce').query({deleteparentcascade_childforce:'330'}).expect(200,[],cb);
						},
						function (cb) {
							r.get('/deletegrandchild').expect(200,[].concat(db.data("deletegrandchild",0)),cb);
						}
					],done);
				});
			});
		});
	});
	describe('with unique fields', function(){
	  describe('single unique field', function(){
	    it('should reject create with conflict', function(done){
	      r.post('/singleunique').type('json').send({firstname:"steve",lastname:"smith"}).expect(409,{lastname:"notunique"},done);
	    });
			it('should accept create with no conflict', function(done){
	      r.post('/singleunique').type('json').send({firstname:"steve",lastname:"jackson"}).expect(201,done);
			});
			it('should reject update with conflict', function(done){
	      r.put('/singleunique/1').type('json').send({firstname:"samantha",lastname:"jones"}).expect(409,{lastname:"notunique"},done);
			});
			it('should accept update with no conflict', function(done){
	      r.put('/singleunique/1').type('json').send({firstname:"samantha",lastname:"stevenson"}).expect(200,done);
			});
			it('should reject patch with conflict', function(done){
	      r.patch('/singleunique/1').type('json').send({lastname:"jones"}).expect(409,{lastname:"notunique"},done);
			});
			it('should accept patch with no conflict', function(done){
	      r.patch('/singleunique/1').type('json').send({lastname:"stevenson"}).expect(200,done);
			});
	  });
		describe('multiple unique fields', function(){
	    it('should reject create with first field conflict', function(done){
	      r.post('/doubleunique').type('json').send({firstname:"steve",lastname:"smith"}).expect(409,{lastname:"notunique"},done);
	    });
	    it('should reject create with other field conflict', function(done){
	      r.post('/doubleunique').type('json').send({firstname:"jill",lastname:"stevenson"}).expect(409,{firstname:"notunique"},done);
	    });
	    it('should reject create with both fields conflict', function(done){
	      r.post('/doubleunique').type('json').send({firstname:"jill",lastname:"smith"}).expect(409,{firstname:"notunique",lastname:"notunique"},done);
	    });
			it('should accept create with no conflict', function(done){
	      r.post('/doubleunique').type('json').send({firstname:"steve",lastname:"stevenson"}).expect(201,done);
			});
			it('should reject update with first field conflict', function(done){
	      r.put('/doubleunique/1').type('json').send({firstname:"steve",lastname:"jones"}).expect(409,{lastname:"notunique"},done);
			});
			it('should reject update with other field conflict', function(done){
	      r.put('/doubleunique/1').type('json').send({firstname:"jill",lastname:"stevenson"}).expect(409,{firstname:"notunique"},done);
			});
			it('should reject update with both field conflict', function(done){
	      r.put('/doubleunique/1').type('json').send({firstname:"jill",lastname:"jones"}).expect(409,{firstname:"notunique",lastname:"notunique"},done);
			});
			it('should accept update with no conflict', function(done){
	      r.put('/doubleunique/1').type('json').send({firstname:"steve",lastname:"stevenson"}).expect(200,done);
			});
			it('should reject patch with first field conflict', function(done){
	      r.patch('/doubleunique/1').type('json').send({lastname:"jones"}).expect(409,{lastname:"notunique"},done);
			});
			it('should reject patch with other field conflict', function(done){
	      r.patch('/doubleunique/1').type('json').send({firstname:"jill"}).expect(409,{firstname:"notunique"},done);
			});
			it('should reject patch with both field conflict', function(done){
	      r.patch('/doubleunique/1').type('json').send({firstname:"jill",lastname:"jones"}).expect(409,{firstname:'notunique',lastname:"notunique"},done);
			});
			it('should accept patch with no conflict', function(done){
	      r.patch('/doubleunique/1').type('json').send({firstname:"steve",lastname:"stevenson"}).expect(200,done);
			});
		});
		describe('combination unique fields', function(){
	    it('should reject create with both fields conflict', function(done){
	      r.post('/combounique').type('json').send({firstname:"sam",lastname:"smith"}).expect(409,{"firstname:lastname":"notunique"},done);
	    });
			it('should reject create with undefined and both fields conflict', function(done){
				r.post('/combounique').type('json').send({firstname:"empty"}).expect(409,{"firstname:lastname":"notunique"},done);
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
	      r.put('/combounique/1').type('json').send({firstname:"jill",lastname:"jones"}).expect(409,{"firstname:lastname":"notunique"},done);
	    });
	    it('should reject update with undefined and both fields conflict', function(done){
	      r.put('/combounique/1').type('json').send({firstname:"empty"}).expect(409,{"firstname:lastname":"notunique"},done);
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
	      r.patch('/combounique/1').type('json').send({firstname:"jill",lastname:"jones"}).expect(409,{"firstname:lastname":"notunique"},done);
	    });
	    it('should accept patch with both fields conflict if it is the same object', function(done){
	      r.patch('/combounique/2').type('json').send({firstname:"jill",lastname:"jones"}).expect(200,done);
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
	    it('should reject patch to one field when it brings both fields into conflict', function(done){
				async.series([
					function (cb) {
			      r.patch('/combounique/1').type('json').send({firstname:"jill"}).expect(200,cb);
					},
					function (cb) {
			      r.patch('/combounique/1').type('json').send({lastname:"jones"}).expect(409,{"firstname:lastname":"notunique"},cb);
					}
				],function (err) {
					if (err) {
						throw(err);
					} else {
						done();
					}
				});
	    });
		});
	  describe('unique field with error suppression', function(){
			var orig = db.data("uniquesuppress",{id:"1"})[0];
			describe('via http', function(){
				it('should not create with conflict but no error', function(done){
					async.series([
						function (cb) {
							r.post('/uniquesuppress').type('json').send({firstname:"steve",lastname:"smith"}).expect(201,cb);
						},
						function (cb) {
							r.get('/uniquesuppress').query({firstname:"steve"}).expect(200,[],cb);
						}
					],done);
				});
				it('should not update with conflict but no error', function(done){
					async.series([
						function (cb) {
							r.put('/uniquesuppress/1').type('json').send({firstname:"samantha",lastname:"jones"}).expect(200,done);
						},
						function (cb) {
							r.get('/uniquesuppress/1').end(function (err,res) {
								res.status.should.eql(200);
								res.body.firstname.should.eql(orig.firstname);
								res.body.lastname.should.eql(orig.lastname);
							});
						}
					],done);
				});
				it('should not patch with conflict but no error', function(done){
					async.series([
						function (cb) {
				      r.patch('/uniquesuppress/1').type('json').send({lastname:"jones"}).expect(200,done);
						},
						function (cb) {
							r.get('/uniquesuppress/1').end(function (err,res) {
								res.status.should.eql(200);
								res.body.firstname.should.eql(orig.firstname);
								res.body.lastname.should.eql(orig.lastname);
							});
						}
					],done);
				});
			});
			describe('direct model', function(){
				it('should not create with conflict but no error', function(done){
					async.series([
						function (cb) {
							booster.models.uniquesuppress.create({firstname:"steve",lastname:"smith"},function (err,res) {
								should(err).not.be.ok;
								cb();
							});
						},
						function (cb) {
							booster.models.uniquesuppress.find({firstname:"steve"},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(0);
								cb();
							});
						}
					],done);
				});
				it('should not update with conflict but no error', function(done){
					async.series([
						function (cb) {
							booster.models.uniquesuppress.update('1',{firstname:"samantha",lastname:"jones"},function (err,res) {
								should(err).not.be.ok;
								cb();
							});
						},
						function (cb) {
							booster.models.uniquesuppress.get("1",function (err,res) {
								should(err).not.be.ok;
								res.firstname.should.eql(orig.firstname);
								res.lastname.should.eql(orig.lastname);
								cb();
							});
						}
					],done);
				});
				it('should not patch with conflict but no error', function(done){
					async.series([
						function (cb) {
							booster.models.uniquesuppress.patch('1',{lastname:"jones"},function (err,res) {
								should(err).not.be.ok;
								cb();
							});
						},
						function (cb) {
							booster.models.uniquesuppress.get("1",function (err,res) {
								should(err).not.be.ok;
								res.firstname.should.eql(orig.firstname);
								res.lastname.should.eql(orig.lastname);
								cb();
							});
						}
					],done);
				});
			});
	  });
	});
	describe('search by integer', function(){
		var cutoff = 15, lt = [], gt = [];
		before(function(){
			_.each(db.data("integers"),function (item) {
				if (item.index <= cutoff) {
					lt.push(item);
				} else {
					gt.push(item);
				}
			});
		});
		it('should give correct results for less than match',function (done) {
			r.get('/integers').query({index:{lt:cutoff}}).expect(200,lt).end(done);
		});
		it('should give correct results for greater than match',function (done) {
			r.get('/integers').query({index:{gt:cutoff}}).expect(200,gt).end(done);
		});
	});
	describe('search by boolean', function(){
		var data = db.data("boolean"), f = _.filter(data,{bool:false}), t = _.filter(data,{bool:true});
		it('should give correct results for false match',function (done) {
			booster.models.boolean.find({bool:false},function (err,res) {
				res.should.eql(f);
				done();
			});
		});
		it('should give correct results for true match',function (done) {
			booster.models.boolean.find({bool:true},function (err,res) {
				res.should.eql(t);
				done();
			});
		});
		it('should give correct results for converting false string match',function (done) {
			booster.models.boolean.find({bool:"false"},function (err,res) {
				res.should.eql(f);
				done();
			});
		});
		it('should give correct results for converting true string match',function (done) {
			booster.models.boolean.find({bool:"true"},function (err,res) {
				res.should.eql(t);
				done();
			});
		});
	});
	describe('with default filter', function(){
		it('should successfully GET filtered records',function (done) {
			r.get('/defaultfilter').expect(200,db.data("defaultfilter",{filter:"yes"})).end(done);
		});
		it('should successfully GET direct record ignoring filter',function (done) {
			r.get('/defaultfilter/1').expect(200,db.data('defaultfilter',0),done);
		});
		it('should override default filter when providing a different one',function (done) {
			r.get('/defaultfilter').query({filter:"no"}).expect(200,db.data("defaultfilter",{filter:"no"}),done);
		});
		it('should return all fields when providing an override filter',function (done) {
			r.get('/defaultfilter').query({filter:"*"}).expect(200,db.data("defaultfilter"),done);
		});
	});
	describe('with default value', function(){
		var newitem, result, id;
		beforeEach(function(done){
			newitem = {title:"New Title"};
			async.waterfall([
				function (cb) {r.post('/withdefault').type('json').send(newitem).expect(201,cb);},
				function (res,cb) {id = res.text; r.get('/withdefault/'+id).expect(200,cb);},
				function (res,cb) {result = res.body; cb();}
			],done);
		});
		it('should set default field value', function(){
			result.content.should.eql("default content");
		});
		it('should not override a passed field', function(){
			result.title.should.eql(newitem.title);
		});
		it('should set default for a required field', function(){
			result.other.should.eql("default other");
		});
		describe('complete replace', function(){
			beforeEach(function(done){
				newitem = {title:"New Title",other:"New Other",content:"New Content"};
				async.waterfall([
					function (cb) {r.put('/withdefault/'+id).type('json').send(newitem).expect(200,cb);},
					function (res,cb) {r.put('/withdefault/'+id).type('json').send({title:"New Title"}).expect(200,cb);},
					function (res,cb) {r.get('/withdefault/'+id).expect(200,cb);},
					function (res,cb) {result = res.body; cb();}
				],done);
			});
			it('should set default field value', function(){
				result.content.should.eql("default content");
			});
			it('should not override a passed field', function(){
				result.title.should.eql(newitem.title);
			});
			it('should set default for a required field', function(){
				result.other.should.eql("default other");
			});
		});
	});
	describe('cascade changes', function(){
		var c1;
		describe('single value', function(){
			describe('match', function(){
				describe('patch', function(){
					beforeEach(function(done){
						c1 = {singlevalue:"published"};
						r.patch('/cascadeone/1').type('json').send(c1).expect(200,done);
					});
					it('should set original item to correct values', function(done){
						r.get('/cascadeone/1').expect(200,_.extend({},db.puredata("cascadeone",0),c1),done);
					});
					it('should cascade to matching child', function(done){
						r.get('/cascadetwo/1').expect(200,_.extend({},db.puredata("cascadetwo",0),{singlevalue:c1.singlevalue}),done);
					});
					it('should not cascade to unmatching child', function(done){
						r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
					});
					it('should cascade to matching grandchild', function(done){
						r.get('/cascadethree/1').expect(200,_.extend({},db.puredata("cascadethree",0),{singlevalue:c1.singlevalue}),done);
					});
					it('should not cascade to unmatching grandchild', function(done){
						r.get('/cascadethree/2').expect(200,db.puredata("cascadethree",1),done);
					});
				});
				describe('put', function(){
					beforeEach(function(done){
						c1 = {singlevalue:"published"};
						r.put('/cascadeone/1').type('json').send(c1).expect(200,done);
					});
					it('should set original item to correct values', function(done){
						r.get('/cascadeone/1').expect(200,_.extend(c1,{id:"1"}),done);
					});
					it('should cascade to matching child', function(done){
						r.get('/cascadetwo/1').expect(200,_.extend({},db.puredata("cascadetwo",0),{singlevalue:c1.singlevalue}),done);
					});
					it('should not cascade to unmatching child', function(done){
						r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
					});
					it('should cascade to matching grandchild', function(done){
						r.get('/cascadethree/1').expect(200,_.extend({},db.puredata("cascadethree",0),{singlevalue:c1.singlevalue}),done);
					});
					it('should not cascade to unmatching grandchild', function(done){
						r.get('/cascadethree/2').expect(200,db.puredata("cascadethree",1),done);
					});
				});
			});
			describe('no match', function(){
				describe('patch', function(){
					beforeEach(function(done){
						c1 = {singlevalue:"foo"};
						r.patch('/cascadeone/1').type('json').send(c1).expect(200,done);
					});
					it('should set original item to correct values', function(done){
						r.get('/cascadeone/1').expect(200,_.extend({},db.puredata("cascadeone",0),c1),done);
					});
					it('should not cascade to matching child', function(done){
						r.get('/cascadetwo/1').expect(200,db.puredata("cascadetwo",0),done);
					});
					it('should not cascade to unmatching child', function(done){
						r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
					});
					it('should not cascade to matching grandchild', function(done){
						r.get('/cascadethree/1').expect(200,db.puredata("cascadethree",0),done);
					});
					it('should not cascade to unmatching grandchild', function(done){
						r.get('/cascadethree/2').expect(200,db.puredata("cascadethree",1),done);
					});
				});
				describe('put', function(){
					beforeEach(function(done){
						c1 = {singlevalue:"foo"};
						r.put('/cascadeone/1').type('json').send(c1).expect(200,done);
					});
					it('should set original item to correct values', function(done){
						r.get('/cascadeone/1').expect(200,_.extend(c1,{id:"1"}),done);
					});
					it('should not cascade to matching child', function(done){
						r.get('/cascadetwo/1').expect(200,db.puredata("cascadetwo",0),done);
					});
					it('should not cascade to unmatching child', function(done){
						r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
					});
					it('should not cascade to matching grandchild', function(done){
						r.get('/cascadethree/1').expect(200,db.puredata("cascadethree",0),done);
					});
					it('should not cascade to unmatching grandchild', function(done){
						r.get('/cascadethree/2').expect(200,db.puredata("cascadethree",1),done);
					});
				});
			});
		});
		describe('array value', function(){
			describe('match', function(){
				describe('patch', function(){
					beforeEach(function(done){
						c1 = {arrayvalue:"published"};
						r.patch('/cascadeone/1').type('json').send(c1).expect(200,done);
					});
					it('should set original item to correct values', function(done){
						r.get('/cascadeone/1').expect(200,_.extend({},db.puredata("cascadeone",0),c1),done);
					});
					it('should cascade to matching child', function(done){
						r.get('/cascadetwo/1').expect(200,_.extend({},db.puredata("cascadetwo",0),{arrayvalue:c1.arrayvalue}),done);
					});
					it('should not cascade to unmatching child', function(done){
						r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
					});
					it('should cascade to matching grandchild', function(done){
						r.get('/cascadethree/1').expect(200,_.extend({},db.puredata("cascadethree",0),{arrayvalue:c1.arrayvalue}),done);
					});
					it('should not cascade to unmatching grandchild', function(done){
						r.get('/cascadethree/2').expect(200,db.puredata("cascadethree",1),done);
					});
				});
				describe('put', function(){
					beforeEach(function(done){
						c1 = {arrayvalue:"published"};
						r.put('/cascadeone/1').type('json').send(c1).expect(200,done);
					});
					it('should set original item to correct values', function(done){
						r.get('/cascadeone/1').expect(200,_.extend(c1,{id:"1"}),done);
					});
					it('should cascade to matching child', function(done){
						r.get('/cascadetwo/1').expect(200,_.extend({},db.puredata("cascadetwo",0),{arrayvalue:c1.arrayvalue}),done);
					});
					it('should not cascade to unmatching child', function(done){
						r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
					});
					it('should cascade to matching grandchild', function(done){
						r.get('/cascadethree/1').expect(200,_.extend({},db.puredata("cascadethree",0),{arrayvalue:c1.arrayvalue}),done);
					});
					it('should not cascade to unmatching grandchild', function(done){
						r.get('/cascadethree/2').expect(200,db.puredata("cascadethree",1),done);
					});
				});
			});
			describe('no match', function(){
				describe('patch', function(){
					beforeEach(function(done){
						c1 = {arrayvalue:"foo"};
						r.patch('/cascadeone/1').type('json').send(c1).expect(200,done);
					});
					it('should set original item to correct values', function(done){
						r.get('/cascadeone/1').expect(200,_.extend({},db.puredata("cascadeone",0),c1),done);
					});
					it('should not cascade to matching child', function(done){
						r.get('/cascadetwo/1').expect(200,db.puredata("cascadetwo",0),done);
					});
					it('should not cascade to unmatching child', function(done){
						r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
					});
					it('should not cascade to matching grandchild', function(done){
						r.get('/cascadethree/1').expect(200,db.puredata("cascadethree",0),done);
					});
					it('should not cascade to unmatching grandchild', function(done){
						r.get('/cascadethree/2').expect(200,db.puredata("cascadethree",1),done);
					});
				});
				describe('put', function(){
					beforeEach(function(done){
						c1 = {arrayvalue:"foo"};
						r.put('/cascadeone/1').type('json').send(c1).expect(200,done);
					});
					it('should set original item to correct values', function(done){
						r.get('/cascadeone/1').expect(200,_.extend(c1,{id:"1"}),done);
					});
					it('should not cascade to matching child', function(done){
						r.get('/cascadetwo/1').expect(200,db.puredata("cascadetwo",0),done);
					});
					it('should not cascade to unmatching child', function(done){
						r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
					});
					it('should not cascade to matching grandchild', function(done){
						r.get('/cascadethree/1').expect(200,db.puredata("cascadethree",0),done);
					});
					it('should not cascade to unmatching grandchild', function(done){
						r.get('/cascadethree/2').expect(200,db.puredata("cascadethree",1),done);
					});
				});
			});
		});
		describe('any value', function(){
			describe('patch', function(){
				beforeEach(function(done){
					c1 = {anyvalue:"foobar"};
					r.patch('/cascadeone/1').type('json').send(c1).expect(200,done);
				});
				it('should set original item to correct values', function(done){
					r.get('/cascadeone/1').expect(200,_.extend({},db.puredata("cascadeone",0),c1),done);
				});
				it('should cascade to matching child', function(done){
					r.get('/cascadetwo/1').expect(200,_.extend({},db.puredata("cascadetwo",0),{anyvalue:c1.anyvalue}),done);
				});
				it('should not cascade to unmatching child', function(done){
					r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
				});
				it('should cascade to matching grandchild', function(done){
					r.get('/cascadethree/1').expect(200,_.extend({},db.puredata("cascadethree",0),{anyvalue:c1.anyvalue}),done);
				});
				it('should not cascade to unmatching grandchild', function(done){
					r.get('/cascadethree/2').expect(200,db.puredata("cascadethree",1),done);
				});
			});
			describe('put', function(){
				beforeEach(function(done){
					c1 = {anyvalue:"foobar"};
					r.put('/cascadeone/1').type('json').send(c1).expect(200,done);
				});
				it('should set original item to correct values', function(done){
					r.get('/cascadeone/1').expect(200,_.extend(c1,{id:"1"}),done);
				});
				it('should cascade to matching child', function(done){
					r.get('/cascadetwo/1').expect(200,_.extend({},db.puredata("cascadetwo",0),{anyvalue:c1.anyvalue}),done);
				});
				it('should not cascade to unmatching child', function(done){
					r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
				});
				it('should cascade to matching grandchild', function(done){
					r.get('/cascadethree/1').expect(200,_.extend({},db.puredata("cascadethree",0),{anyvalue:c1.anyvalue}),done);
				});
				it('should not cascade to unmatching grandchild', function(done){
					r.get('/cascadethree/2').expect(200,db.puredata("cascadethree",1),done);
				});
			});
		});
		describe('multiple children', function(){
			describe('patch', function(){
				beforeEach(function(done){
					c1 = {multiplechildren:"published"};
					r.patch('/cascadeone/1').type('json').send(c1).expect(200,done);
				});
				it('should set original item to correct values', function(done){
					r.get('/cascadeone/1').expect(200,_.extend({},db.puredata("cascadeone",0),c1),done);
				});
				it('should cascade to one matching child', function(done){
					r.get('/cascadetwo/1').expect(200,_.extend({},db.puredata("cascadetwo",0),{multiplechildren:c1.multiplechildren}),done);
				});
				it('should not cascade to unmatching child', function(done){
					r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
				});
				it('should cascade to other matching child', function(done){
					r.get('/cascadefour/1').expect(200,_.extend({},db.puredata("cascadefour",0),{multiplechildren:c1.multiplechildren}),done);
				});
				it('should not cascade to unmatching other child', function(done){
					r.get('/cascadefour/2').expect(200,db.puredata("cascadefour",1),done);
				});
				it('should ignore filter on child', function(done){
					r.get('/cascadefilter/1').expect(200,_.extend({},db.puredata("cascadefilter",0),{multiplechildren:c1.multiplechildren}),done);
				});
			});
			describe('put', function(){
				beforeEach(function(done){
					c1 = {multiplechildren:"published"};
					r.put('/cascadeone/1').type('json').send(c1).expect(200,done);
				});
				it('should set original item to correct values', function(done){
					r.get('/cascadeone/1').expect(200,_.extend(c1,{id:"1"}),done);
				});
				it('should cascade to one matching child', function(done){
					r.get('/cascadetwo/1').expect(200,_.extend({},db.puredata("cascadetwo",0),{multiplechildren:c1.multiplechildren}),done);
				});
				it('should not cascade to unmatching child', function(done){
					r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
				});
				it('should cascade to other matching child', function(done){
					r.get('/cascadefour/1').expect(200,_.extend({},db.puredata("cascadefour",0),{multiplechildren:c1.multiplechildren}),done);
				});
				it('should not cascade to unmatching other child', function(done){
					r.get('/cascadefour/2').expect(200,db.puredata("cascadefour",1),done);
				});
				it('should ignore filter on child', function(done){
					r.get('/cascadefilter/1').expect(200,_.extend({},db.puredata("cascadefilter",0),{multiplechildren:c1.multiplechildren}),done);
				});
			});
		});
		describe('no children', function(){
			describe('patch', function(){
				beforeEach(function(done){
					c1 = {nochildren:"published"};
					r.patch('/cascadeone/1').type('json').send(c1).expect(200,done);
				});
				it('should set original item to correct values', function(done){
					r.get('/cascadeone/1').expect(200,_.extend({},db.puredata("cascadeone",0),c1),done);
				});
				it('should not cascade to matching child', function(done){
					r.get('/cascadetwo/1').expect(200,db.puredata("cascadetwo",0),done);
				});
				it('should not cascade to unmatching child', function(done){
					r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
				});
			});
			describe('put', function(){
				beforeEach(function(done){
					c1 = {nochildren:"published"};
					r.put('/cascadeone/1').type('json').send(c1).expect(200,done);
				});
				it('should set original item to correct values', function(done){
					r.get('/cascadeone/1').expect(200,_.extend(c1,{id:"1"}),done);
				});
				it('should not cascade to matching child', function(done){
					r.get('/cascadetwo/1').expect(200,db.puredata("cascadetwo",0),done);
				});
				it('should not cascade to unmatching child', function(done){
					r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
				});
			});
		});
		describe('unmatched children', function(){
			describe('patch', function(){
				beforeEach(function(done){
					c1 = {errorchildren:"published"};
					r.patch('/cascadeone/1').type('json').send(c1).expect(200,done);
				});
				it('should set original item to correct values', function(done){
					r.get('/cascadeone/1').expect(200,_.extend({},db.puredata("cascadeone",0),c1),done);
				});
				it('should not cascade to matching child', function(done){
					r.get('/cascadetwo/1').expect(200,db.puredata("cascadetwo",0),done);
				});
				it('should not cascade to unmatching child', function(done){
					r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
				});
			});
			describe('put', function(){
				beforeEach(function(done){
					c1 = {errorchildren:"published"};
					r.put('/cascadeone/1').type('json').send(c1).expect(200,done);
				});
				it('should set original item to correct values', function(done){
					r.get('/cascadeone/1').expect(200,_.extend(c1,{id:"1"}),done);
				});
				it('should not cascade to matching child', function(done){
					r.get('/cascadetwo/1').expect(200,db.puredata("cascadetwo",0),done);
				});
				it('should not cascade to unmatching child', function(done){
					r.get('/cascadetwo/2').expect(200,db.puredata("cascadetwo",1),done);
				});
			});
		});
	});
	describe('delete prevent self', function(){
		var orig = db.data("deletepreventself",0), id = orig.id;
		it('should allow to call model.delete', function(done){
			booster.models.deletepreventself.destroy(id,function (err,res) {
				should(err).not.be.ok;
				should(res).eql(id);
				done();
			});
		});
		it('should still have item afterwards', function(done){
			async.waterfall([
				function (cb) {
					booster.models.deletepreventself.destroy(id,cb);
				},
				function (res,cb) {
					booster.models.deletepreventself.get(id,cb);
				},
				function (res,cb) {
					res.id.should.eql(orig.id);
					res.text.should.eql(orig.text);
					res.cancelled.should.be.true;
					cb();
				}
			],done);
		});
		it('should call the filter', function(done){
			booster.models.deletepreventself.destroy(id,function (err,res) {
				booster.models.filtercalled.should.eql(id);
				booster.models.filtercalled.should.eql(id);
				done();
			});
		});
		it('should call the post-processor', function(done){
			booster.models.deletepreventself.destroy(id,function (err,res) {
				booster.models.postcalled.should.eql(id);
				done();
			});
		});
	});
	describe('filters', function(){
		var id = '1';
	  it('should allow through get without block', function(done){
			booster.models.modelfilter.get(id,function (err,res) {
				should(err).not.be.ok;
				res.should.eql(db.data("modelfilter",0));
				done();
			});
	  });
	  it('should prevent the blocked get', function(done){
			booster.models.modelfilter.get('BAD',function (err,res) {
				should(err).eql("error");
				should(res).not.be.ok;
				done();
			});
	  });
	  it('should allow through index without block', function(done){
			booster.models.modelfilter.find({},function (err,res) {
				should(err).not.be.ok;
				res.should.eql(db.data("modelfilter"));
				done();
			});
	  });
	  it('should prevent the blocked index', function(done){
			booster.models.modelfilter.find({title:"BAD"},function (err,res) {
				should(err).eql("error");
				should(res).not.be.ok;
				done();
			});
	  });
	  it('should allow through update without block', function(done){
			booster.models.modelfilter.update(id,{comment:"New comment",title:"New title"},function (err,res) {
				should(err).not.be.ok;
				res.should.eql(id);
				done();
			});
	  });
	  it('should prevent the blocked update', function(done){
			booster.models.modelfilter.update(id,{title:'BAD',comment:"New comment"},function (err,res) {
				should(err).eql("error");
				should(res).not.be.ok;
				done();
			});
	  });
	  it('should allow through patch without block', function(done){
			booster.models.modelfilter.patch(id,{comment:"New Comment"},function (err,res) {
				should(err).not.be.ok;
				res.should.eql(id);
				done();
			});
	  });
	  it('should prevent the blocked patch', function(done){
			booster.models.modelfilter.patch(id,{title:"BAD"},function (err,res) {
				should(err).eql("error");
				should(res).not.be.ok;
				done();
			});
	  });
	  it('should allow through create without block', function(done){
			booster.models.modelfilter.create({title:"New title"},function (err,res) {
				should(err).not.be.ok;
				res.should.be.type("string");
				done();
			});
	  });
	  it('should prevent the blocked create', function(done){
			booster.models.modelfilter.create({title:"BAD"},function (err,res) {
				should(err).eql("error");
				should(res).not.be.ok;
				done();
			});
	  });
	  it('should allow through destroy without block', function(done){
			booster.models.modelfilter.destroy(id,function (err,res) {
				should(err).not.be.ok;
				should(db.data("modelfilter",0)).not.be.ok;
				done();
			});
	  });
	  it('should prevent the blocked destroy', function(done){
			booster.models.modelfilter.destroy('BAD',function (err,res) {
				should(err).eql("error");
				should(res).not.be.ok;
				done();
			});
	  });
	});
	describe('post processors', function(){
	  it('should process for get', function(done){
			booster.models.modelpost.get('1',function (err,res) {
				should(err).not.be.ok;
				res.comment.should.eql("ADDED");
				done();
			});
	  });
	  it('should process for find', function(done){
			booster.models.modelpost.find({id:"1"},function (err,res) {
				should(err).not.be.ok;
				res[0].comment.should.eql("ADDED");
				done();
			});
	  });
	  it('should process for update', function(done){
			booster.models.modelpost.update('1',{comment:"New comment",title:"New title"},function (err,res) {
				should(err).not.be.ok;
				booster.models.called.should.eql(res);
				done();
			});
	  });
	  it('should process for patch', function(done){
			booster.models.modelpost.patch('1',{comment:"New Comment"},function (err,res) {
				should(err).not.be.ok;
				booster.models.called.should.eql(res);
				done();
			});
	  });
	  it('should process for create', function(done){
			booster.models.modelpost.create({title:"New title"},function (err,res) {
				should(err).not.be.ok;
				booster.models.called.should.eql(res);
				done();
			});
	  });
	  it('should process for destroy', function(done){
			booster.models.modelpost.destroy('1',function (err,res) {
				should(err).not.be.ok;
				booster.models.called.should.eql('1');
				done();
			});
	  });
	  it('should process for embedded create', function(done){
			booster.models.modeldoublepost.create({title:"New title"},function (err,res) {
				should(err).not.be.ok;
				booster.models.called.should.eql(res);
				done();
			});
	  });
	});
	describe('$b fields', function(){
		var bfield = '$b.user', update = {name:"New Name"};
	  it('should process for update', function(done){
			var now = Date.now();
			update[bfield] = now;
			booster.models.bfields.update('1',update,function (err,res) {
				should(err).not.be.ok;
				booster.models._filter.should.eql(now);
				booster.models._post.should.eql(now);
				done();
			});
	  });
	  it('should process for patch', function(done){
			var now = Date.now();
			update[bfield] = now;
			booster.models.bfields.patch('1',update,function (err,res) {
				should(err).not.be.ok;
				booster.models._filter.should.eql(now);
				booster.models._post.should.eql(now);
				done();
			});
	  });
	  it('should process for create', function(done){
			var now = Date.now();
			update[bfield] = now;
			booster.models.bfields.create(update,function (err,res) {
				should(err).not.be.ok;
				booster.models._filter.should.eql(now);
				booster.models._post.should.eql(now);
				done();
			});
	  });
	});
});
