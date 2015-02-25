/*jslint node:true, unused:vars */
var bfield = '$b.user';

module.exports = {
	// IMPORTANT: no $b field defined
	fields: {
		id: {required:true,createoptional:true,mutable:false},
		name: {required:true}
	},
	filter: {
		update: function (key,model,models,callback) {
			models._filter = model[bfield];
			callback();
		},
		patch: function (key,model,models,callback) {
			models._filter = model[bfield];
			callback();
		},
		create: function (model,models,callback) {
			models._filter = model[bfield];
			callback();
		}
	},
	post: {
		update: function (key,model,models,err,result,callback) {
			models._post = model[bfield];
			callback();
		},
		patch: function (key,model,models,err,result,callback) {
			models._post = model[bfield];
			callback();
		},
		create: function (model,models,err,result,callback) {
			models._post = model[bfield];
			callback();
		}
	}
};