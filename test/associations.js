/*global beforeEach,before, describe,it */
/*jslint node:true, debug:true, nomen:true,expr:true */
/*jshint unused:vars */
var express = require('express'), _ = require('lodash'), request = require('supertest'), booster = require('../lib/booster'), 
should = require('should'), async = require('async'), db = require('./resources/db'), bodyParser = require('body-parser');



// call the debugger in case we are in debug mode
describe('associations',function () {
	var app, r, m,
	assocList = ['parent','onechild','manychild','mmchild','join','other'],
	assoc = {}, items = {};
	_.each(assocList,function (name) {
		items[name] = db.data("assoc"+name,0);
		assoc[name] = items[name].id;
	});
	items.oneorphan = db.data("assoconechild",1);
	assoc.oneorphan = items.oneorphan.id;

	items.manyorphan = db.data("assocmanychild",1);
	assoc.manyorphan = items.manyorphan.id;

	beforeEach(function(){
		db.reset();
	});
	describe('resource embed', function(){
		before(function (done) {
			app = this.app = express();
			app.use(bodyParser.json());
			booster.init({db:db,app:app,models:__dirname+'/resources/models'});
			booster.resource('assocparent'); // association parent - has_one and has_many and many_to_many
			booster.resource('assoconechild',{embed:true}); // association child - belongs_to the has_one
			booster.resource('assocmanychild',{embed:['foo','assoc']}); // association child - belongs_to the has_many
			r = request(app);
			done();
		});
		describe('embed true', function(){
			it('should populate get with embed', function(done){
				r.get('/assoconechild/'+assoc.onechild).query({'$b.embed':'assoc'}).end(function (err,res) {
					should(err).not.be.ok;
					res.body.assoc.should.eql(items.parent);
					done();
				});
			});
			it('should populate find with embed', function(done){
				r.get('/assoconechild').query(_.extend({'$b.embed':'assoc'},{name:items.onechild.name})).end(function (err,res) {
					should(err).not.be.ok;
					res.body.length.should.eql(1);
					res.body[0].assoc.should.eql(items.parent);
					done();
				});
			});
		});
		describe('embed false', function(){
			it('should reject get with embed', function(done){
				r.get('/assocparent/'+assoc.parent).query({'$b.embed':'assoc'}).expect(403,done);
			});
			it('should reject find with embed', function(done){
				r.get('/assocparent').query(_.extend({'$b.embed':'assoc'},{name:items.parent.name})).expect(403,done);
			});
		});
		describe('embed list', function(){
			it('should populate get with valid embed', function(done){
				r.get('/assocmanychild/'+assoc.manychild).query({'$b.embed':'assoc,foo'}).end(function (err,res) {
					should(err).not.be.ok;
					res.body.assoc.should.eql(items.parent);
					done();
				});
			});
			it('should populate find with valid embed', function(done){
				r.get('/assocmanychild').query(_.extend({'$b.embed':'assoc,foo'},{name:items.manychild.name})).end(function (err,res) {
					should(err).not.be.ok;
					res.body.length.should.eql(1);
					res.body[0].assoc.should.eql(items.parent);
					done();
				});
			});
			it('should reject get with invalid embed', function(done){
				r.get('/assocmanychild/'+assoc.manychild).query({'$b.embed':'bar'}).expect(403,done);
			});
			it('should reject find with invalid embed', function(done){
				r.get('/assocmanychild').query(_.extend({'$b.embed':'bar'},{name:items.manychild.name})).expect(403,done);
			});
		});
	});
	describe('all embed', function(){
		before(function (done) {
			app = this.app = express();
			app.use(bodyParser.urlencoded({extended:true}));
			app.use(bodyParser.json());
			booster.init({db:db,app:app,models:__dirname+'/resources/models',embed:true});
			booster.resource('assocparent'); // association parent - has_one and has_many and many_to_many
			booster.resource('assoconechild'); // association child - belongs_to the has_one
			booster.resource('assocmanychild'); // association child - belongs_to the has_many
			booster.resource('assocother'); // association other for parallel or deep relations
			booster.resource('assocmmchild'); // association child - has_many to the has_many
			booster.resource('assocjoin'); // association join resource
			r = request(app);
			done();
		});
		describe('one-to-one', function(){
			describe('belongs_to side', function(){
				var search = {name:items.onechild.name};
				before(function(){
					m = booster.models.assoconechild;
				});
				describe('changes', function(){
					it('should reject create with invalid relation', function(done){
						m.create({name:"A child",assoc:"1"},function (err,res) {
							should(err).eql({assoc:"invalid"});
							done();
						});
					});
					it('should reject update with invalid relation', function(done){
						m.update(assoc.onechild,{name:"A child",assoc:"1"},function (err,res) {
							should(err).eql({assoc:"invalid"});
							done();
						});
					});
					it('should reject patch with valid relation', function(done){
						m.patch(assoc.onechild,{assoc:"1"},function (err,res) {
							should(err).eql({assoc:"invalid"});
							done();
						});
					});
					it('should accept create with valid relation', function(done){
						var item = {name:"A child",assoc:assoc.parent}, id;
						async.waterfall([
							function (cb) {
								m.create(item,cb);
							},
							function (res,cb) {
								id = res;
								id.should.be.type("string");
								m.get(id,cb);
							},
							function (res,cb) {
								res.should.eql(_.extend(item,{id:id}));
								cb();
							}
						],done);
					});
					it('should accept update with valid relation', function(done){
						var item = {name:"A child",assoc:assoc.parent}, id;
						async.waterfall([
							function (cb) {
								m.update(assoc.onechild,{name:"A child",assoc:assoc.parent},cb);
							},
							function (res,cb) {
								id = res;
								id.should.eql(assoc.onechild);
								m.get(id,cb);
							},
							function (res,cb) {
								res.should.eql(_.extend(item,{id:id}));
								cb();
							}
						],done);
					});
					it('should accept patch with valid relation', function(done){
						var item = {assoc:assoc.parent}, id;
						async.waterfall([
							function (cb) {
								m.patch(assoc.onechild,item,cb);
							},
							function (res,cb) {
								id = res;
								id.should.eql(assoc.onechild);
								m.get(id,cb);
							},
							function (res,cb) {
								res.should.eql(_.extend({},items.onechild,item));
								cb();
							}
						],done);
					});
				});
				describe('model', function(){
					describe('get', function(){
						it('should not populate without embed', function(done){
							m.get(assoc.onechild,function (err,res) {
								should(err).not.be.ok;
								res.assoc.should.eql(assoc.parent);
								done();
							});
						});
						it('should ignore invalid embed', function(done){
							m.get(assoc.onechild,{"$b.embed":"foo"},function (err,res) {
								should(err).not.be.ok;
								res.assoc.should.eql(assoc.parent);
								done();
							});
						});
						it('should ignore empty value', function(){
							m.get(assoc.oneorphan,{"$b.embed":"assoc"},function (err,res) {
								should(err).not.be.ok;
								should(res.assoc).not.be.ok;
							});
						});
						it('should populate single with embed', function(done){
							m.get(assoc.onechild,{"$b.embed":"assoc"},function (err,res) {
								should(err).not.be.ok;
								res.assoc.should.eql(items.parent);
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							m.get(assoc.onechild,{"$b.embed":"assoc,assoc_other"},function (err,res) {
								should(err).not.be.ok;
								res.assoc.should.eql(items.parent);
								res.assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							m.get(assoc.onechild,{"$b.embed":["assoc","assoc_other"]},function (err,res) {
								should(err).not.be.ok;
								res.assoc.should.eql(items.parent);
								res.assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							m.get(assoc.onechild,{"$b.embed":["assoc","assoc.hasmany"]},function (err,res) {
								should(err).not.be.ok;
								res.assoc.id.should.eql(items.parent.id);
								res.assoc.name.should.eql(items.parent.name);
								res.assoc.hasmany.should.eql([].concat(items.manychild));
								done();
							});
						});
					});
					describe('find', function(){
						it('should not populate without embed', function(done){
							m.find(search,function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].assoc.should.eql(assoc.parent);
								done();
							});
						});
						it('should ignore invalid embed', function(done){
							m.find(search,{"$b.embed":"foo"},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].assoc.should.eql(assoc.parent);
								done();
							});
						});
						it('should populate single with embed', function(done){
							m.find(search,{"$b.embed":"assoc"},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].assoc.should.eql(items.parent);
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							m.find(search,{"$b.embed":"assoc,assoc_other"},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].assoc.should.eql(items.parent);
								res[0].assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							m.find(search,{"$b.embed":["assoc","assoc_other"]},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].assoc.should.eql(items.parent);
								res[0].assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							m.find(search,{"$b.embed":["assoc","assoc.hasmany"]},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].assoc.id.should.eql(items.parent.id);
								res[0].assoc.name.should.eql(items.parent.name);
								res[0].assoc.hasmany.should.eql([].concat(items.manychild));
								done();
							});
						});
					});
				});
				describe('controller', function(){
					describe('get', function(){
						it('should populate single with embed', function(done){
							r.get('/assoconechild/'+assoc.onechild).query({'$b.embed':'assoc'}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.assoc.should.eql(items.parent);
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							r.get('/assoconechild/'+assoc.onechild).query({'$b.embed':'assoc,assoc_other'}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.assoc.should.eql(items.parent);
								res.body.assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							r.get('/assoconechild/'+assoc.onechild).query({'$b.embed':['assoc','assoc_other']}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.assoc.should.eql(items.parent);
								res.body.assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							r.get('/assoconechild/'+assoc.onechild).query({'$b.embed':['assoc','assoc.hasmany']}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.assoc.id.should.eql(items.parent.id);
								res.body.assoc.name.should.eql(items.parent.name);
								res.body.assoc.hasmany.should.eql([].concat(items.manychild));
								done();
							});
						});
					});
					describe('find', function(){
						it('should populate single with embed', function(done){
							r.get('/assoconechild').query(_.extend({'$b.embed':'assoc'},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].assoc.should.eql(items.parent);
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							r.get('/assoconechild').query(_.extend({'$b.embed':'assoc,assoc_other'},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].assoc.should.eql(items.parent);
								res.body[0].assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							r.get('/assoconechild').query(_.extend({'$b.embed':['assoc','assoc_other']},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].assoc.should.eql(items.parent);
								res.body[0].assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							r.get('/assoconechild').query(_.extend({'$b.embed':['assoc','assoc.hasmany']},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].assoc.id.should.eql(items.parent.id);
								res.body[0].assoc.name.should.eql(items.parent.name);
								res.body[0].assoc.hasmany.should.eql([].concat(items.manychild));
								done();
							});
						});
					});
				});
			});
			describe('has_one side', function(){
				var search = {name:items.parent.name};
				before(function(){
					m = booster.models.assocparent;
				});
				describe('changes', function(){
					it('should reject create with invalid relation', function(done){
						m.create({name:"A parent",hasone:"1"},function (err,res) {
							should(err).eql({hasone:"invalid"});
							done();
						});
					});
					it('should reject update with invalid relation', function(done){
						m.update(assoc.parent,{name:"A parent",hasone:"1"},function (err,res) {
							should(err).eql({hasone:"invalid"});
							done();
						});
					});
					it('should reject patch with invalid relation', function(done){
						m.patch(assoc.parent,{hasone:"1"},function (err,res) {
							should(err).eql({hasone:"invalid"});
							done();
						});
					});
					it('should accept create with valid relation', function(done){
						var item = {name:"A parent",hasone:assoc.onechild}, id;
						async.waterfall([
							function (cb) {
								m.create(item,cb);
							},
							function (res,cb) {
								id = res;
								id.should.be.type("string");
								booster.models.assoconechild.get(assoc.onechild,cb);
							},
							function (res,cb) {
								res.assoc.should.eql(id);
								cb();
							}
						],done);
					});
					it('should accept update with valid relation', function(done){
						var id, rid;
						async.waterfall([
							function (cb) {
								booster.models.assoconechild.create({name:"New Child"},cb);
							},
							function (res,cb) {
								rid = res;
								m.update(assoc.parent,{name:"A parent",hasone:rid},cb);
							},
							function (res,cb) {
								id = res;
								id.should.eql(assoc.parent);
								booster.models.assoconechild.get(rid,cb);
							},
							function (res,cb) {
								res.assoc.should.eql(id);
								m.get(id,cb);
							},
							function (res,cb) {
								should(res.hasone).eql(undefined);
								cb();
							}
						],done);
					});
					it('should accept patch with valid relation', function(done){
						var id, rid;
						async.waterfall([
							function (cb) {
								booster.models.assoconechild.create({name:"New Child"},cb);
							},
							function (res,cb) {
								rid = res;
								m.patch(assoc.parent,{hasone:rid},cb);
							},
							function (res,cb) {
								id = res;
								id.should.eql(assoc.parent);
								booster.models.assoconechild.get(assoc.onechild,cb);
							},
							function (res,cb) {
								res.assoc.should.eql(id);
								m.get(id,cb);
							},
							function (res,cb) {
								should(res.hasone).eql(undefined);
								cb();
							}
						],done);
					});
				});
				describe('model', function(){
					describe('get', function(){
						it('should not populate without embed', function(done){
							m.get(assoc.parent,function (err,res) {
								should(err).not.be.ok;
								should(res.hasone).eql(undefined);
								done();
							});
						});
						it('should ignore invalid embed', function(done){
							m.get(assoc.parent,{"$b.embed":"foo"},function (err,res) {
								should(err).not.be.ok;
								should(res.hasone).eql(undefined);
								done();
							});
						});
						it('should populate single with embed', function(done){
							m.get(assoc.parent,{"$b.embed":"hasone"},function (err,res) {
								should(err).not.be.ok;
								res.hasone.should.eql(items.onechild);
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							m.get(assoc.parent,{"$b.embed":"hasone,hasother"},function (err,res) {
								should(err).not.be.ok;
								res.hasone.should.eql(items.onechild);
								res.hasother.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							m.get(assoc.parent,{"$b.embed":["hasone","hasother"]},function (err,res) {
								should(err).not.be.ok;
								res.hasone.should.eql(items.onechild);
								res.hasother.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							m.get(assoc.parent,{"$b.embed":["hasone","hasone.assoc_other"]},function (err,res) {
								should(err).not.be.ok;
								res.hasone.id.should.eql(items.onechild.id);
								res.hasone.name.should.eql(items.onechild.name);
								res.hasone.assoc_other.should.eql(items.other);
								done();
							});
						});
					});
					describe('find', function(){
						it('should not populate without embed', function(done){
							m.find(search,function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								should(res[0].hasone).eql(undefined);
								done();
							});
						});
						it('should ignore invalid embed', function(done){
							m.find(search,{"$b.embed":"foo"},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								should(res[0].hasone).eql(undefined);
								done();
							});
						});
						it('should populate single with embed', function(done){
							m.find(search,{"$b.embed":"hasone"},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].hasone.should.eql(items.onechild);
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							m.find(search,{"$b.embed":"hasone,hasother"},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].hasone.should.eql(items.onechild);
								res[0].hasother.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							m.find(search,{"$b.embed":["hasone","hasother"]},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].hasone.should.eql(items.onechild);
								res[0].hasother.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							m.find(search,{"$b.embed":["hasone","hasone.assoc_other"]},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].hasone.id.should.eql(items.onechild.id);
								res[0].hasone.name.should.eql(items.onechild.name);
								res[0].hasone.assoc_other.should.eql(items.other);
								done();
							});
						});
					});
				});
				describe('controller', function(){
					describe('get', function(){
						it('should populate single with embed', function(done){
							r.get('/assocparent/'+assoc.parent).query({'$b.embed':'hasone'}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.hasone.should.eql(items.onechild);
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							r.get('/assocparent/'+assoc.parent).query({'$b.embed':'hasone,hasother'}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.hasone.should.eql(items.onechild);
								res.body.hasother.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							r.get('/assocparent/'+assoc.parent).query({'$b.embed':['hasone','hasother']}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.hasone.should.eql(items.onechild);
								res.body.hasother.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							r.get('/assocparent/'+assoc.parent).query({'$b.embed':['hasone','hasone.assoc_other']}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.hasone.id.should.eql(items.onechild.id);
								res.body.hasone.name.should.eql(items.onechild.name);
								res.body.hasone.assoc_other.should.eql(items.other);
								done();
							});
						});
					});
					describe('find', function(){
						it('should populate single with embed', function(done){
							r.get('/assocparent').query(_.extend({'$b.embed':'hasone'},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].hasone.should.eql(items.onechild);
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							r.get('/assocparent').query(_.extend({'$b.embed':'hasone,hasother'},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].hasone.should.eql(items.onechild);
								res.body[0].hasother.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							r.get('/assocparent').query(_.extend({'$b.embed':['hasone','hasother']},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].hasone.should.eql(items.onechild);
								res.body[0].hasother.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							r.get('/assocparent').query(_.extend({'$b.embed':['hasone','hasone.assoc_other']},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].hasone.id.should.eql(items.onechild.id);
								res.body[0].hasone.name.should.eql(items.onechild.name);
								res.body[0].hasone.assoc_other.should.eql(items.other);
								done();
							});
						});
					});
				});
			});
		});
		describe('one-to-many', function(){
			describe('belongs_to side', function(){
				var search = {name:items.manychild.name};
				before(function(){
					m = booster.models.assocmanychild;
				});
				describe('changes', function(){
					it('should reject create with invalid relation', function(done){
						m.create({name:"A child",assoc:"1"},function (err,res) {
							should(err).eql({assoc:"invalid"});
							done();
						});
					});
					it('should reject update with invalid relation', function(done){
						m.update(assoc.manychild,{name:"A child",assoc:"1"},function (err,res) {
							should(err).eql({assoc:"invalid"});
							done();
						});
					});
					it('should reject patch with invalid relation', function(done){
						m.patch(assoc.manychild,{assoc:"1"},function (err,res) {
							should(err).eql({assoc:"invalid"});
							done();
						});
					});
					it('should accept create with valid relation', function(done){
						var item = {name:"A child",assoc:assoc.parent}, id;
						async.waterfall([
							function (cb) {
								m.create(item,cb);
							},
							function (res,cb) {
								id = res;
								id.should.be.type("string");
								m.get(id,cb);
							},
							function (res,cb) {
								res.should.eql(_.extend(item,{id:id}));
								cb();
							}
						],done);
					});
					it('should accept update with valid relation', function(done){
						var item = {name:"A child",assoc:assoc.parent}, id;
						async.waterfall([
							function (cb) {
								m.update(assoc.manychild,{name:"A child",assoc:assoc.parent},cb);
							},
							function (res,cb) {
								id = res;
								id.should.eql(assoc.manychild);
								m.get(id,cb);
							},
							function (res,cb) {
								res.should.eql(_.extend(item,{id:id}));
								cb();
							}
						],done);
					});
					it('should accept patch with valid relation', function(done){
						var item = {assoc:assoc.parent}, id;
						async.waterfall([
							function (cb) {
								m.patch(assoc.manychild,item,cb);
							},
							function (res,cb) {
								id = res;
								id.should.eql(assoc.manychild);
								m.get(id,cb);
							},
							function (res,cb) {
								res.should.eql(_.extend({},items.manychild,item));
								cb();
							}
						],done);
					});
				});
				describe('model', function(){
					describe('get', function(){
						it('should not populate without embed', function(done){
							m.get(assoc.manychild,function (err,res) {
								should(err).not.be.ok;
								res.assoc.should.eql(assoc.parent);
								done();
							});
						});
						it('should ignore invalid embed', function(done){
							m.get(assoc.manychild,{"$b.embed":"foo"},function (err,res) {
								should(err).not.be.ok;
								res.assoc.should.eql(assoc.parent);
								done();
							});
						});
						it('should ignore empty value', function(){
							m.get(assoc.manyorphan,{"$b.embed":"assoc"},function (err,res) {
								should(err).not.be.ok;
								should(res.assoc).not.be.ok;
							});
						});
						it('should populate single with embed', function(done){
							m.get(assoc.manychild,{"$b.embed":"assoc"},function (err,res) {
								should(err).not.be.ok;
								res.assoc.should.eql(items.parent);
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							m.get(assoc.manychild,{"$b.embed":"assoc,assoc_other"},function (err,res) {
								should(err).not.be.ok;
								res.assoc.should.eql(items.parent);
								res.assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							m.get(assoc.manychild,{"$b.embed":["assoc","assoc_other"]},function (err,res) {
								should(err).not.be.ok;
								res.assoc.should.eql(items.parent);
								res.assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							m.get(assoc.manychild,{"$b.embed":["assoc","assoc.hasone"]},function (err,res) {
								should(err).not.be.ok;
								res.assoc.id.should.eql(items.parent.id);
								res.assoc.name.should.eql(items.parent.name);
								res.assoc.hasone.should.eql(items.onechild);
								done();
							});
						});
					});
					describe('find', function(){
						it('should not populate without embed', function(done){
							m.find(search,function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].assoc.should.eql(assoc.parent);
								done();
							});
						});
						it('should ignore invalid embed', function(done){
							m.find(search,{"$b.embed":"foo"},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].assoc.should.eql(assoc.parent);
								done();
							});
						});
						it('should populate single with embed', function(done){
							m.find(search,{"$b.embed":"assoc"},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].assoc.should.eql(items.parent);
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							m.find(search,{"$b.embed":"assoc,assoc_other"},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].assoc.should.eql(items.parent);
								res[0].assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							m.find(search,{"$b.embed":["assoc","assoc_other"]},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].assoc.should.eql(items.parent);
								res[0].assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							m.find(search,{"$b.embed":["assoc","assoc.hasone"]},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].assoc.id.should.eql(items.parent.id);
								res[0].assoc.name.should.eql(items.parent.name);
								res[0].assoc.hasone.should.eql(items.onechild);
								done();
							});
						});
					});
				});
				describe('controller', function(){
					describe('get', function(){
						it('should populate single with embed', function(done){
							r.get('/assocmanychild/'+assoc.manychild).query({'$b.embed':'assoc'}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.assoc.should.eql(items.parent);
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							r.get('/assocmanychild/'+assoc.manychild).query({'$b.embed':'assoc,assoc_other'}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.assoc.should.eql(items.parent);
								res.body.assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							r.get('/assocmanychild/'+assoc.manychild).query({'$b.embed':['assoc','assoc_other']}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.assoc.should.eql(items.parent);
								res.body.assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							r.get('/assocmanychild/'+assoc.manychild).query({'$b.embed':['assoc','assoc.hasone']}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.assoc.id.should.eql(items.parent.id);
								res.body.assoc.name.should.eql(items.parent.name);
								res.body.assoc.hasone.should.eql(items.onechild);
								done();
							});
						});
					});
					describe('find', function(){
						it('should populate single with embed', function(done){
							r.get('/assocmanychild').query(_.extend({'$b.embed':'assoc'},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].assoc.should.eql(items.parent);
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							r.get('/assocmanychild').query(_.extend({'$b.embed':'assoc,assoc_other'},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].assoc.should.eql(items.parent);
								res.body[0].assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							r.get('/assocmanychild').query(_.extend({'$b.embed':['assoc','assoc_other']},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].assoc.should.eql(items.parent);
								res.body[0].assoc_other.should.eql(items.other);
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							r.get('/assocmanychild').query(_.extend({'$b.embed':['assoc','assoc.hasone']},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].assoc.id.should.eql(items.parent.id);
								res.body[0].assoc.name.should.eql(items.parent.name);
								res.body[0].assoc.hasone.should.eql(items.onechild);
								done();
							});
						});
					});
				});
			});
			describe('has_many side', function(){
				before(function(){
					m = booster.models.assocparent;
				});
				var search = {name:items.parent.name};
				it('should reject create with invalid relation', function(done){
					m.create({name:"A parent",hasmany:"1"},function (err,res) {
						should(err).eql({hasmany:"invalid"});
						done();
					});
				});
				it('should reject update with invalid relation', function(done){
					m.update(assoc.parent,{name:"A parent",hasmany:"1"},function (err,res) {
						should(err).eql({hasmany:"invalid"});
						done();
					});
				});
				it('should reject patch with invalid relation', function(done){
					m.patch(assoc.parent,{hasmany:"1"},function (err,res) {
						should(err).eql({hasmany:"invalid"});
						done();
					});
				});
				it('should accept create with valid relation', function(done){
					var item = {name:"A parent",hasmany:assoc.manychild}, id;
					async.waterfall([
						function (cb) {
							m.create(item,cb);
						},
						function (res,cb) {
							id = res;
							id.should.be.type("string");
							booster.models.assocmanychild.get(assoc.manychild,cb);
						},
						function (res,cb) {
							res.assoc.should.eql(id);
							cb();
						}
					],done);
				});
				it('should accept update with valid relation', function(done){
					var id, rid;
					async.waterfall([
						function (cb) {
							booster.models.assocmanychild.create({name:"New Child"},cb);
						},
						function (res,cb) {
							rid = res;
							m.update(assoc.parent,{name:"A parent",hasmany:rid},cb);
						},
						function (res,cb) {
							id = res;
							id.should.eql(assoc.parent);
							booster.models.assocmanychild.get(rid,cb);
						},
						function (res,cb) {
							res.assoc.should.eql(id);
							m.get(id,cb);
						},
						function (res,cb) {
							should(res.hasmany).eql(undefined);
							cb();
						}
					],done);
				});
				it('should accept patch with valid relation', function(done){
					var rid, id;
					async.waterfall([
						function (cb) {
							booster.models.assocmanychild.create({name:"New Child"},cb);
						},
						function (res,cb) {
							rid = res;
							m.patch(assoc.parent,{hasmany:rid},cb);
						},
						function (res,cb) {
							id = res;
							id.should.eql(assoc.parent);
							booster.models.assocmanychild.get(rid,cb);
						},
						function (res,cb) {
							res.assoc.should.eql(id);
							m.get(id,cb);
						},
						function (res,cb) {
							should(res.hasmany).eql(undefined);
							cb();
						}
					],done);
				});
				describe('model', function(){
					describe('get', function(){
						it('should not populate without embed', function(done){
							m.get(assoc.parent,function (err,res) {
								should(err).not.be.ok;
								should(res.hasmany).eql(undefined);
								done();
							});
						});
						it('should ignore invalid embed', function(done){
							m.get(assoc.parent,{"$b.embed":"foo"},function (err,res) {
								should(err).not.be.ok;
								should(res.hasmany).eql(undefined);
								done();
							});
						});
						it('should populate single with embed', function(done){
							m.get(assoc.parent,{"$b.embed":"hasmany"},function (err,res) {
								should(err).not.be.ok;
								res.hasmany.should.eql([].concat(items.manychild));
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							m.get(assoc.parent,{"$b.embed":"hasmany,hasone"},function (err,res) {
								should(err).not.be.ok;
								res.hasone.should.eql(items.onechild);
								res.hasmany.should.eql([].concat(items.manychild));
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							m.get(assoc.parent,{"$b.embed":["hasmany","hasone"]},function (err,res) {
								should(err).not.be.ok;
								res.hasone.should.eql(items.onechild);
								res.hasmany.should.eql([].concat(items.manychild));
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							m.get(assoc.parent,{"$b.embed":["hasmany","hasmany.assoc_other"]},function (err,res) {
								should(err).not.be.ok;
								res.hasmany[0].id.should.eql(items.manychild.id);
								res.hasmany[0].name.should.eql(items.manychild.name);
								res.hasmany[0].assoc_other.should.eql(items.other);
								done();
							});
						});
					});
					describe('find', function(){
						it('should not populate without embed', function(done){
							m.find(search,function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								should(res[0].hasmany).eql(undefined);
								done();
							});
						});
						it('should ignore invalid embed', function(done){
							m.find(search,{"$b.embed":"foo"},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								should(res[0].hasmany).eql(undefined);
								done();
							});
						});
						it('should populate single with embed', function(done){
							m.find(search,{"$b.embed":"hasmany"},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								should(res[0].hasmany).eql([].concat(items.manychild));
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							m.find(search,{"$b.embed":"hasmany,hasone"},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].hasone.should.eql(items.onechild);
								res[0].hasmany.should.eql([].concat(items.manychild));
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							m.find(search,{"$b.embed":["hasmany","hasone"]},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].hasone.should.eql(items.onechild);
								res[0].hasmany.should.eql([].concat(items.manychild));
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							m.find(search,{"$b.embed":["hasmany","hasmany.assoc_other"]},function (err,res) {
								should(err).not.be.ok;
								res.length.should.eql(1);
								res[0].hasmany[0].id.should.eql(items.manychild.id);
								res[0].hasmany[0].name.should.eql(items.manychild.name);
								res[0].hasmany[0].assoc_other.should.eql(items.other);
								done();
							});
						});
					});
				});
				describe('controller', function(){
					describe('get', function(){
						it('should populate single with embed', function(done){
							r.get('/assocparent/'+assoc.parent).query({'$b.embed':'hasmany'}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.hasmany.should.eql([].concat(items.manychild));
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							r.get('/assocparent/'+assoc.parent).query({'$b.embed':'hasmany,hasone'}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.hasone.should.eql(items.onechild);
								res.body.hasmany.should.eql([].concat(items.manychild));
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							r.get('/assocparent/'+assoc.parent).query({'$b.embed':['hasmany','hasone']}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.hasone.should.eql(items.onechild);
								res.body.hasmany.should.eql([].concat(items.manychild));
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							r.get('/assocparent/'+assoc.parent).query({'$b.embed':['hasmany','hasmany.assoc_other']}).end(function (err,res) {
								should(err).not.be.ok;
								res.body.hasmany[0].id.should.eql(items.manychild.id);
								res.body.hasmany[0].name.should.eql(items.manychild.name);
								res.body.hasmany[0].assoc_other.should.eql(items.other);
								done();
							});
						});
					});
					describe('find', function(){
						it('should populate single with embed', function(done){
							r.get('/assocparent').query(_.extend({'$b.embed':'hasmany'},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].hasmany.should.eql([].concat(items.manychild));
								done();
							});
						});
						it('should populate multiple embed commas', function(done){
							r.get('/assocparent').query(_.extend({'$b.embed':'hasmany,hasone'},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].hasone.should.eql(items.onechild);
								res.body[0].hasmany.should.eql([].concat(items.manychild));
								done();
							});
						});
						it('should populate multiple embed array', function(done){
							r.get('/assocparent').query(_.extend({'$b.embed':['hasmany','hasone']},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].hasone.should.eql(items.onechild);
								res.body[0].hasmany.should.eql([].concat(items.manychild));
								done();
							});
						});
						it('should populate multiple deep embed', function(done){
							r.get('/assocparent').query(_.extend({'$b.embed':['hasmany','hasmany.assoc_other']},search)).end(function (err,res) {
								should(err).not.be.ok;
								res.body.length.should.eql(1);
								res.body[0].hasmany[0].id.should.eql(items.manychild.id);
								res.body[0].hasmany[0].name.should.eql(items.manychild.name);
								res.body[0].hasmany[0].assoc_other.should.eql(items.other);
								done();
							});
						});
					});
				});
			});
		});
		describe('many-to-many', function(){
			// for many-to-many, both sides are the same type, so it does not matter which side we test
			var search = {name:items.parent.name};
			before(function(){
				m = booster.models.assocparent;
			});
			it('should reject create with invalid relation', function(done){
				m.create({name:"A parent",manytomany:"1"},function (err,res) {
					should(err).eql({manytomany:"invalid"});
					done();
				});
			});
			it('should reject update with invalid relation', function(done){
				m.update(assoc.parent,{name:"A parent",manytomany:"1"},function (err,res) {
					should(err).eql({manytomany:"invalid"});
					done();
				});
			});
			it('should reject patch with invalid relation', function(done){
				m.patch(assoc.parent,{manytomany:"1"},function (err,res) {
					should(err).eql({manytomany:"invalid"});
					done();
				});
			});
			it('should accept create with valid relation', function(done){
				var item = {name:"A parent",manytomany:assoc.mmchild}, id;
				async.waterfall([
					function (cb) {
						m.create(item,cb);
					},
					function (res,cb) {
						id = res;
						id.should.be.type("string");
						booster.models.assocjoin.find({side1:id,side2:assoc.mmchild},cb);
					},
					function (res,cb) {
						res.length.should.eql(1);
						cb();
					}
				],done);
			});
			it('should accept update with valid relation', function(done){
				var rid, id;
				async.waterfall([
					function (cb) {
						booster.models.assocmmchild.create({name:"New Child"},cb);
					},
					function (res,cb) {
						rid = res;
						m.update(assoc.parent,{manytomany:rid,name:"Foo"},cb);
					},
					function (res,cb) {
						id = res;
						id.should.eql(assoc.parent);
						booster.models.assocjoin.find({side1:id,side2:rid},cb);
					},
					function (res,cb) {
						res.length.should.eql(1);
						cb();
					}
				],done);
			});
			it('should accept patch with valid relation', function(done){
				var rid, id;
				async.waterfall([
					function (cb) {
						booster.models.assocmmchild.create({name:"New Child"},cb);
					},
					function (res,cb) {
						rid = res;
						m.patch(assoc.parent,{manytomany:rid},cb);
					},
					function (res,cb) {
						id = res;
						id.should.eql(assoc.parent);
						booster.models.assocjoin.find({side1:id,side2:rid},cb);
					},
					function (res,cb) {
						res.length.should.eql(1);
						cb();
					}
				],done);
			});
			describe('model', function(){
				describe('get', function(){
					it('should not populate without embed', function(done){
						m.get(assoc.parent,function (err,res) {
							should(err).not.be.ok;
							should(res.manytomany).eql(undefined);
							done();
						});
					});
					it('should ignore invalid embed', function(done){
						m.get(assoc.parent,{"$b.embed":"foo"},function (err,res) {
							should(err).not.be.ok;
							should(res.manytomany).eql(undefined);
							done();
						});
					});
					it('should populate single with embed', function(done){
						m.get(assoc.parent,{"$b.embed":"manytomany"},function (err,res) {
							should(err).not.be.ok;
							res.manytomany.should.eql([].concat(items.mmchild));
							done();
						});
					});
					it('should populate multiple embed commas', function(done){
						m.get(assoc.parent,{"$b.embed":"manytomany,hasone"},function (err,res) {
							should(err).not.be.ok;
							res.hasone.should.eql(items.onechild);
							res.manytomany.should.eql([].concat(items.mmchild));
							done();
						});
					});
					it('should populate multiple embed array', function(done){
						m.get(assoc.parent,{"$b.embed":["manytomany","hasone"]},function (err,res) {
							should(err).not.be.ok;
							res.hasone.should.eql(items.onechild);
							res.manytomany.should.eql([].concat(items.mmchild));
							done();
						});
					});
					it('should populate multiple deep embed', function(done){
						m.get(assoc.parent,{"$b.embed":["manytomany","manytomany.hasone"]},function (err,res) {
							should(err).not.be.ok;
							res.manytomany[0].id.should.eql(items.mmchild.id);
							res.manytomany[0].name.should.eql(items.mmchild.name);
							res.manytomany[0].hasone.should.eql(items.onechild);
							done();
						});
					});
				});
				describe('find', function(){
					it('should not populate without embed', function(done){
						m.find(search,function (err,res) {
							should(err).not.be.ok;
							res.length.should.eql(1);
							should(res[0].manytomany).eql(undefined);
							done();
						});
					});
					it('should ignore invalid embed', function(done){
						m.find(search,{"$b.embed":"foo"},function (err,res) {
							should(err).not.be.ok;
							res.length.should.eql(1);
							should(res[0].manytomany).eql(undefined);
							done();
						});
					});
					it('should populate single with embed', function(done){
						m.find(search,{"$b.embed":"manytomany"},function (err,res) {
							should(err).not.be.ok;
							res.length.should.eql(1);
							should(res[0].manytomany).eql([].concat(items.mmchild));
							done();
						});
					});
					it('should populate multiple embed commas', function(done){
						m.find(search,{"$b.embed":"manytomany,hasone"},function (err,res) {
							should(err).not.be.ok;
							res.length.should.eql(1);
							res[0].hasone.should.eql(items.onechild);
							res[0].manytomany.should.eql([].concat(items.mmchild));
							done();
						});
					});
					it('should populate multiple embed array', function(done){
						m.find(search,{"$b.embed":["manytomany","hasone"]},function (err,res) {
							should(err).not.be.ok;
							res.length.should.eql(1);
							res[0].hasone.should.eql(items.onechild);
							res[0].manytomany.should.eql([].concat(items.mmchild));
							done();
						});
					});
					it('should populate multiple deep embed', function(done){
						m.find(search,{"$b.embed":["manytomany","manytomany.hasone"]},function (err,res) {
							should(err).not.be.ok;
							res.length.should.eql(1);
							res[0].manytomany[0].id.should.eql(items.mmchild.id);
							res[0].manytomany[0].name.should.eql(items.mmchild.name);
							res[0].manytomany[0].hasone.should.eql(items.onechild);
							done();
						});
					});
				});
			});
			describe('controller', function(){
				describe('get', function(){
					it('should populate single with embed', function(done){
						r.get('/assocparent/'+assoc.parent).query({'$b.embed':'manytomany'}).end(function (err,res) {
							should(err).not.be.ok;
							res.body.manytomany.should.eql([].concat(items.mmchild));
							done();
						});
					});
					it('should populate multiple embed commas', function(done){
						r.get('/assocparent/'+assoc.parent).query({'$b.embed':'manytomany,hasone'}).end(function (err,res) {
							should(err).not.be.ok;
							res.body.hasone.should.eql(items.onechild);
							res.body.manytomany.should.eql([].concat(items.mmchild));
							done();
						});
					});
					it('should populate multiple embed array', function(done){
						r.get('/assocparent/'+assoc.parent).query({'$b.embed':['manytomany','hasone']}).end(function (err,res) {
							should(err).not.be.ok;
							res.body.hasone.should.eql(items.onechild);
							res.body.manytomany.should.eql([].concat(items.mmchild));
							done();
						});
					});
					it('should populate multiple deep embed', function(done){
						r.get('/assocparent/'+assoc.parent).query({'$b.embed':['manytomany','manytomany.hasone']}).end(function (err,res) {
							should(err).not.be.ok;
							res.body.manytomany[0].id.should.eql(items.mmchild.id);
							res.body.manytomany[0].name.should.eql(items.mmchild.name);
							res.body.manytomany[0].hasone.should.eql(items.onechild);
							done();
						});
					});
				});
				describe('find', function(){
					it('should populate single with embed', function(done){
						r.get('/assocparent').query(_.extend({'$b.embed':'manytomany'},search)).end(function (err,res) {
							should(err).not.be.ok;
							res.body.length.should.eql(1);
							res.body[0].manytomany.should.eql([].concat(items.mmchild));
							done();
						});
					});
					it('should populate multiple embed commas', function(done){
						r.get('/assocparent').query(_.extend({'$b.embed':'manytomany,hasone'},search)).end(function (err,res) {
							should(err).not.be.ok;
							res.body.length.should.eql(1);
							res.body[0].hasone.should.eql(items.onechild);
							res.body[0].manytomany.should.eql([].concat(items.mmchild));
							done();
						});
					});
					it('should populate multiple embed array', function(done){
						r.get('/assocparent').query(_.extend({'$b.embed':['manytomany','hasone']},search)).end(function (err,res) {
							should(err).not.be.ok;
							res.body.length.should.eql(1);
							res.body[0].hasone.should.eql(items.onechild);
							res.body[0].manytomany.should.eql([].concat(items.mmchild));
							done();
						});
					});
					it('should populate multiple deep embed', function(done){
						r.get('/assocparent').query(_.extend({'$b.embed':['manytomany','manytomany.hasone']},search)).end(function (err,res) {
							should(err).not.be.ok;
							res.body.length.should.eql(1);
							res.body[0].manytomany[0].id.should.eql(items.mmchild.id);
							res.body[0].manytomany[0].name.should.eql(items.mmchild.name);
							res.body[0].manytomany[0].hasone.should.eql(items.onechild);
							done();
						});
					});
				});
			});
		});
	});
});
