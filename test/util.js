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
	describe('removeAssociations', function(){
		var input = {a:25,b:"30",hasone:"1",hasmany:"2",belongsto:"3",manytomany:"4"};
		it('should return the original when no asociation fields', function(){
			var fields = {};
			util.removeAssociations(input,fields).should.eql(input);
		});
		it('should return the original without association fields', function(){
			var fields = {
				hasone:{association:{type:'has_one'}},
				hasmany:{association:{type:'has_many'}},
				manytomany:{association:{type:'many_to_many'}},
				belongsto:{association:{type:'belongs_to'}}
			};
			util.removeAssociations(input,fields).should.eql(_.omit(input,"hasone","hasmany","manytomany"));
		});
	});
	describe('removeUnique', function(){
		describe('without suppress', function(){
			it('should return null for null object', function(){
				should(util.removeUnique(null)).eql(null);
			});
			it('should return null for empty errors object', function(){
				should(util.removeUnique({})).eql(null);
			});
			it('should return original for errors object with just unique errors', function(){
				var orig = {a:"notunique",b:"notunique"};
				should(util.removeUnique(orig)).eql(orig);
			});
			it('should return original for errors object with all kinds of errors', function(){
				var orig = {a:"notunique",b:"notunique",c:"a",d:10};
				should(util.removeUnique(orig)).eql(orig);
			});
		});
		describe('with suppress', function(){
			it('should return null for null object', function(){
				should(util.removeUnique(null,true)).eql(null);
			});
			it('should return null for empty errors object', function(){
				should(util.removeUnique({},true)).eql(null);
			});
			it('should return null for errors object with just unique errors', function(){
				should(util.removeUnique({a:"notunique",b:"notunique"},true)).eql(null);
			});
			it('should return hash without unique errors', function(){
				should(util.removeUnique({a:"notunique",b:"notunique",c:"a",d:10},true)).eql({c:"a",d:10});
			});
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
		it('should return object for embedded object', function(){
			util.extractEmbed({'$b.embed':{a:0}}).should.eql({a:0});
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
