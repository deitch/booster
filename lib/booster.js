/*jslint node:true, nomen:true */
/*global unescape */

var fs = require('fs'), _ = require('lodash'), modelFactory = require('./model'), controllerFactory = require('./controller'),
config, CONTROLLERS = __dirname+'./routes', MODELS = __dirname+'./models', reqLoader,
loadModel, loadController, trailSlash, trim, models = {}, controllers = {}, routes = {}, baseRoutes;

baseRoutes = {
	index: ["GET",false],
	show: ["GET",true],
	create: ["POST",false],
	update: ["PUT",true],
	destroy: ["DEL",true],
};

trailSlash = function (str) {
	return(str !== null && str !== undefined && typeof(str) === "string" && str.slice(-1) !== '/' ? str+'/' : str);
};
trim = function (str) {
	return((str||"").replace(/(^\s+|\s+$)/g,""));
};

reqLoader = function (req,res,next) {
	req.booster = {
		param : config.param,
		models : models
	};
	next();
};

loadModel = function(name,path,models,db) {
	var ret, module;
	/*jslint stupid:true */
	if (fs.existsSync(path+'.js')) {
		/*jslint stupid:false */
    module = require(path);
	} else {
		module = null;
	}
	ret = modelFactory.generate(name,models,db,module);
	return ret;
};
loadController = function(name,path,models,config) {
	var ret, module;
	/*jslint stupid:true */
	if (fs.existsSync(path+name+'.js')) {
		/*jslint stupid:false */
    module = require(path+name);
	} else {
		module = null;
	}
	ret = controllerFactory.generate(name,module);
	return ret;
};


module.exports = {
	init: function(conf) {
		config = _.extend({},conf);
		//booster.init({app:app,db:db,controllers:'./controllers',models:'./models'});
		// validate we have what we need
		config.controllers = trailSlash(config.controllers || CONTROLLERS);
		config.models = trailSlash(config.models || MODELS);
		config.param = config.param || {};
		
		return(this);
	},
	resource: function(name,opts) {
		// load and activate models and controllers for this resource, if they are available
		var m, c, app = config.app, basePath = "", adder = "";
		opts = opts || {};
		name = trim(name).replace(/^.*\//,"");
		if (name) {
			if (opts.parent) {
				basePath += routes[opts.parent] + "/:"+opts.parent;
			} else if (opts.base) {
				basePath += opts.base;
			}
			if (basePath.charAt(0) !== '/') {
				basePath = '/' + basePath;
			}
			if (!opts.root) {
				basePath += name;
				adder = '/';
			}
			//basePath = basePath.replace(/\/$/,"");
			models[name] = m = loadModel(name,config.models+name,models,config.db);
			controllers[name] = c = loadController(name,config.controllers,models,config.param);
			routes[name] = basePath;
			// set up the routes using express routes
			_.each(baseRoutes,function (route,method) {
				var verb = route[0].toLowerCase(), path = basePath+(route[1] ? adder+':'+name : '');
				if (c[method] && typeof(c[method]) === "function") {
					app[verb](path,reqLoader,c[method]);
				}
			});
		}
		
		return(this);
	},
	models: models,
	controllers: controllers	
};
