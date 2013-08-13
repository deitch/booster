/*jslint node:true, nomen:true */
/*global unescape */

var fs = require('fs'), _ = require('lodash'), modelFactory = require('./model'), controllerFactory = require('./controller'),
config, CONTROLLERS = './routes', MODELS = './models', reqLoader, textParser = require('./textParser'),
loadModel, loadController, trailSlash, trim, models = {}, controllers = {}, routes = {}, ctrlrRoutes = {
	base: {
		index: ["GET",false],
		show: ["GET",true],
		create: ["POST",false],
		update: ["PUT",true],
		patch: ["PATCH",true],
		destroy: ["DEL",true]
	},
	property: {
		getProperty: "GET",
		setProperty: "PUT"
	}
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
    module = require(fs.realpathSync(path+'.js'));
		/*jslint stupid:false */
	} else {
		module = null;
	}
	ret = modelFactory.generate(name,models,db,module);
	return ret;
};
loadController = function(name,path,models,parent,config) {
	var ret, module;
	/*jslint stupid:true */
	if (fs.existsSync(path+name+'.js')) {
    module = require(fs.realpathSync(path+name+'.js'));
		/*jslint stupid:false */
	} else {
		module = null;
	}
	ret = controllerFactory.generate(name,module,parent);
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
		// reset to be safe
		this.models = models = {};
		this.controllers = controllers = {};
		routes = {};
		
		// add the reqLoader
		conf.app.use(textParser);
		conf.app.use(reqLoader);
		
		return(this);
	},
	resource: function(name,opts) {
		// load and activate models and controllers for this resource, if they are available
		var m, c, app = config.app, basePath = "", adder = "", before;
		opts = opts || {};
		name = trim(name).replace(/^.*\//,"");
		if (name) {
			if (opts.parent) {
				basePath += routes[opts.parent] + "/:"+opts.parent + '/';
			} else if (opts.base) {
				basePath += opts.base;
			}
			if (basePath.charAt(0) !== '/') {
				basePath = '/' + basePath;
			}
			if (basePath.slice(-1) !== '/') {
				basePath += '/';
			}
			if (!opts.root) {
				basePath += name;
				adder = '/';
			}
			models[name] = m = loadModel(name,config.models+name,models,config.db);
			controllers[name] = c = loadController(name,config.controllers,models,opts.parent,config.param);
			before = c.before || function (req,res,next) {next();};
			routes[name] = basePath;
			// set up the routes using express routes
			_.each(ctrlrRoutes.base,function (route,method) {
				var verb = route[0].toLowerCase(), path = basePath+(route[1] ? adder+':'+name : '');
				if (c[method] && typeof(c[method]) === "function") {
					app[verb](path,reqLoader,before,c[method]);
				}
			});
			_.each(ctrlrRoutes.property,function (route,method) {
				var verb = route.toLowerCase();
				if (c[method] && typeof(c[method] === "function")) {
					app[verb](basePath+adder+":"+name+'/:property',reqLoader,before,c[method]);
				}
			});
		}
		return(this);
	},
	validator: require('./validator').validate,
	models: models,
	controllers: controllers	
};
