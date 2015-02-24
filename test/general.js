/*global beforeEach,describe,it */
/*jslint node:true, debug:true, nomen:true */
/*jshint unused:vars */
var express = require('express'), request = require('supertest'), booster = require('../lib/booster'), 
db = require('./resources/db');


// call the debugger in case we are in debug mode
describe('general route',function () {
	var app, r;
	beforeEach(function(){
		db.reset();
		app = this.app = express();
	});
	beforeEach(function (done) {
		app.use(express.urlencoded());
		app.use(express.json());
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
    r.get('/booster').end(function (err,res) {
    	res.status.should.eql(200);
			res.body.models.should.eql({post:{}});
			res.body.param.should.eql({});
			done();
    });
  });
});
