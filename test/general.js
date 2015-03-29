/*global beforeEach,describe,it */
/*jslint node:true, debug:true, nomen:true */
/*jshint unused:vars */
var express = require('express'), request = require('supertest'), booster = require('../lib/booster'), 
db = require('./resources/db'), bodyParser = require('body-parser');


// call the debugger in case we are in debug mode
describe('general route',function () {
	var app, r;
	beforeEach(function(){
		db.reset();
		app = this.app = express();
	});
	beforeEach(function (done) {
		app.use(bodyParser.urlencoded({extended:true}));
		app.use(bodyParser.json());
		app.use(function (req,res,next) {
			req.hasBooster = {};
			next();
		});
		app.use(booster.reqLoader);
		app.use(function (req,res,next) {
			req.hasBooster.pre = req.booster;
			next();
		});
		booster.init({db:db,app:app});
		app.use(function (req,res,next) {
			req.hasBooster.post = req.booster;
			next();
		});
		booster.resource('post');
		app.get('/booster',function (req,res,next) {
			req.hasBooster.route = req.booster;
			res.send(req.hasBooster);
		});
		r = request(app);
		done();
	});
  it('should have access to req.booster on non-booster route', function(done){
    r.get('/booster').end(function (err,res) {
    	res.status.should.eql(200);
			res.body.route.models.should.eql({post:{}});
			res.body.route.param.should.eql({});
			done();
    });
  });
  it('should have access to req.booster on post-init middleware', function(done){
    r.get('/booster').end(function (err,res) {
    	res.status.should.eql(200);
			res.body.post.models.should.eql({post:{}});
			res.body.post.param.should.eql({});
			done();
    });
  });
  it('should have access to req.booster on post-init middleware', function(done){
    r.get('/booster').end(function (err,res) {
    	res.status.should.eql(200);
			res.body.pre.models.should.eql({post:{}});
			res.body.pre.param.should.eql({});
			done();
    });
  });
});
