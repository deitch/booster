/*jslint node:true, nomen:true */

var settings = {
	database   : {
		protocol : "mysql", // or "postgresql"
		query    : { pool: true },
		host     : "127.0.0.1",
		database : "boosterexample",
		user     : "booster",
		password : "booster"
	}
};

module.exports = settings;