/*global describe,it */
/*jslint node:true, debug:true, nomen:true */
/*jshint unused:vars */
var _ = require('lodash'), should = require('should'), util = require('../lib/util');


// call the debugger in case we are in debug mode
describe('util',function () {
	describe('removeDollarB', function(){
		it('should return the original when no dollarB', function(){
			var clean = {a:25,b:"30"};
			util.removeDollarB(clean).should.eql(clean);
		});
		it('should return the original without dollarB', function(){
			var clean = {a:25,b:"30"};
			util.removeDollarB(_.extend({},clean,{'$b.embed':'2,3','$b.fooo':56})).should.eql(clean);
		});
	});
	describe('extractEmbed', function(){
		it('should return null for null', function(){
			should(util.extractEmbed(null)).eql(null);
		});
		it('should return null for undefined', function(){
			should(util.extractEmbed()).eql(null);
		});
		it('should return null for empty object', function(){
			should(util.extractEmbed({})).eql(null);
		});
		it('should return null for object without b.embed', function(){
			should(util.extractEmbed({a:"25"})).eql(null);
		});
		it('should return correct for single embed', function(){
			util.extractEmbed({'$b.embed':'a'}).should.eql({a:{}});
		});
		it('should return correct for comma embed', function(){
			util.extractEmbed({'$b.embed':'a,b'}).should.eql({a:{},b:{}});
		});
		it('should return correct for array embed', function(){
			util.extractEmbed({'$b.embed':['a','b']}).should.eql({a:{},b:{}});
		});
		it('should return correct for two-level embed', function(){
			util.extractEmbed({'$b.embed':'a.b'}).should.eql({a:{b:{}}});
		});
		it('should return correct for four-level embed', function(){
			util.extractEmbed({'$b.embed':'a.b.c.d'}).should.eql({a:{b:{c:{d:{}}}}});
		});
	});
});
