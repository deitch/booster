/*jslint node:true, debug:true, nomen:true */
var express = require('express'), _ = require('lodash'), booster = require('../lib/booster'), 
async = require('async'), path, PORT = 31057, isOrm, db;
var app = express();

isOrm = process.argv && process.argv.length > 2 && process.argv[2] === "orm2";

app.use(express.bodyParser());

if (isOrm) {
	db = require('./db-orm2');
} else {
	db = require('./db');
}

booster.init({db:db,app:app,models:__dirname+'/resources/models'});
booster.resource('post');
booster.resource('comment',{parent:'post'});

app.listen(PORT);

console.log("send your requests to http://localhost:"+PORT);




