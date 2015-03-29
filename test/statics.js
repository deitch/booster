/*global beforeEach,describe,it */
/*jslint node:true, debug:true, nomen:true */
/*jshint unused:vars */
var express = require('express'), request = require('supertest'), booster = require('../lib/booster'), 
db = require('./resources/db'), bodyParser = require('body-parser');



var app, r;
describe('statics', function(){
	beforeEach(function (done) {
		db.reset();
		app = this.app = express();
		app.use(bodyParser.urlencoded({extended:true}));
		app.use(bodyParser.json());
		booster.init({db:db,app:app,models:__dirname+'/resources/models'});
		booster.resource('extender');
		r = request(app);
		done();
	});
	it('should have models hash', function(){
	  booster.models.should.have.property('extender');
	});
	it('should extend extender model to have function extra',function () {
		booster.models.extender.should.have.property("extra");
	});	  
	it('should have the extra on extender models as a function',function () {
		booster.models.extender.extra.should.be.type("function");
	});
	it('should return the correct element on the extra function', function(){
	  booster.models.extender.extra().should.equal("I am an extra function");
	});
});
