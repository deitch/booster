/*jslint node:true, nomen:true */
/*jshint unused:vars */

var fs = require('fs'), _ = require('lodash'), async = require('async'), crypto = require('crypto'),
pluralize = require('pluralize'),
modelFactory = require('./model'), controllerFactory = require('./controller'),
config, CONTROLLERS = './routes', MODELS = './models', textParser = require('./textParser'),
loadModel, loadController, loadGlobalFilters, trailSlash, trim, models = {}, controllers = {}, globalFilters = {}, routes = {}, 
children = {}, pluralMapper = {},
ctrlrRoutes = {
	base: {
		index: ["GET",false],
		show: ["GET",true],
		create: ["POST",false],
		update: ["PUT",true],
		patch: ["PATCH",true],
		destroy: ["DELETE",true]
	},
	property: {
		getProperty: "GET",
		setProperty: "PUT"
	}
}, hashify = function (obj) {
	obj = obj || {};
	// get the keys and sort
	var keys = _.keys(obj).sort(), out = [];
	_.each(keys,function (k) {
		out.push(k+":"+(typeof(obj[k]) === "object" ? hashify(obj[k]) : obj[k]));
	});
	out = crypto.createHash('md5').update(out.join(",")).digest("hex");
	return(out);
};

trailSlash = function (str) {
	return(str !== null && str !== undefined && typeof(str) === "string" && str.slice(-1) !== '/' ? str+'/' : str);
};
trim = function (str) {
	return((str||"").replace(/(^\s+|\s+$)/g,""));
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
loadController = function(name,pathName,path,models,opts,sendObject,config) {
	var ret, module;
	/*jslint stupid:true */
	if (fs.existsSync(path+name+'.js')) {
    module = require(fs.realpathSync(path+name+'.js'));
		/*jslint stupid:false */
	} else {
		module = null;
	}
	ret = controllerFactory.generate(name,pathName,module,opts,sendObject);
	// keep a copy of it
	if (!controllers[name]) {
		controllers[name] = ret;
	}
	return ret;
};

// load the globalFilters
loadGlobalFilters = function(path) {
	// try to require the file
	var ret;
	if (fs.existsSync(path+'.js')) {
    ret = require(fs.realpathSync(path+'.js'));
		/*jslint stupid:false */
	} else {
		ret = {};
	}
	return(ret);
};


module.exports = {
	init: function(conf) {
		config = _.extend({},conf);
		//booster.init({app:app,db:db,controllers:'./controllers',models:'./models',sendObject:true|false});
		// validate we have what we need
		config.controllers = trailSlash(config.controllers || CONTROLLERS);
		config.models = trailSlash(config.models || MODELS);
		config.param = config.param || {};
		config.base = config.base || "";
		config.sendObject = config.sendObject || false;
		// reset to be safe
		this.models = models = {};
		routes = {};
		globalFilters = loadGlobalFilters(config.filters) || {};
		
		// add the reqLoader
		conf.app.use(textParser);
		conf.app.use(this.reqLoader);
		
		return(this);
	},
	reqLoader : function (req,res,next) {
		req.booster = req.booster || {
			param : config.param,
			models : models,
			children: children
		};
		next();
	},
	resource: function(resourceName) {
		// load and activate models and controllers for this resource, if they are available
		var m, app = config.app, reqLoader = this.reqLoader,
		name, optsAry = Array.prototype.slice.call(arguments,1),
		
		
		
		loadPath = function (parentPath,opts) {
			var basePath = "", adder = "", pathName = opts.name || name, format = '.:format?',
			fullPathName = opts.pluralize ? pluralize(pathName) : pathName, 
			c = loadController(name,pathName,config.controllers,models,opts,config.sendObject,config.param),
			middleware = [reqLoader], processors = [];
			
			// keep track of pluralization
			pluralMapper[fullPathName] = pathName;
			
			if (opts.parent) {
				basePath += parentPath + "/:"+opts.parent + '/';
			} else if (opts.base) {
				basePath += opts.base;
			} else if (config.base) {
				basePath += config.base;
			}
			if (basePath.charAt(0) !== '/') {
				basePath = '/' + basePath;
			}
			if (basePath.slice(-1) !== '/') {
				basePath += '/';
			}
			if (!opts.root) {
				basePath += fullPathName;
				adder = '/';
			}
			routes[name] = (routes[name] || []).concat(basePath);
		
			// set up the middleware
			if (globalFilters.all && typeof(globalFilters.all) === "function") {
				middleware.push(globalFilters.all);
			}
			if (globalFilters.filter && globalFilters.filter.all && typeof(globalFilters.filter.all) === "function") {
				middleware.push(globalFilters.filter.all);
			}
			if (c.all && typeof(c.all) === "function") {
				middleware.push(c.all);
			}
			if (c.filter && c.filter.all && typeof(c.filter.all) === "function") {
				middleware.push(c.filter.all);
			}
			if (c.post && c.post.all && typeof(c.post.all) === "function") {
				processors.push(c.post.all);
			}
			// set up the routes using express routes
			_.each(ctrlrRoutes.base,function (route,method) {
				var verb = route[0].toLowerCase(), path = basePath+(route[1] ? adder+':'+pathName : '')+format, 
					gf = (globalFilters.filter||{})[method],
					filter = (c.filter||{})[method], mw = [].concat(middleware,gf||[],filter || []), post = (c.post||{})[method],
					pp = [].concat(processors,post || []);
				if (c[method] && typeof(c[method]) === "function") {
					app[verb](path,mw,(function(c,method){
						return function (req,res,next) {
							var r = res.send;
							res.send = function (body) {
								// undo what we did for res.send...
								res.send = r;
								if (pp && pp.length > 0) {
									async.each(pp,function(item,callback){
										item(req,res,callback,body);
									},function (err,data) {
										if (err) {
											next(err);
										} else {
											res.send(body);
										}
									});
								} else {
									res.send(body);
								}
							};
							c[method](req,res,next);
						};
					}(c,method)));
				}
			});
			// special properties come first
			_.each(c.properties||{},function (handles,prop) {
				if (handles) {
					if (handles.get && typeof(handles.get) === "function") {
						app.get(basePath+adder+':'+pathName+'/'+prop+format,middleware,handles.get);
					}
					if (handles.set && typeof(handles.set) === "function") {
						app.put(basePath+adder+':'+pathName+'/'+prop+format,middleware,handles.set);
					}
				}
			});
		
			// and the special resource properties
			_.each(opts.resource,function (types,pathProp) {
				var fullPath = basePath+adder+':'+pathName+'/'+pathProp+format, method, gf, mw, pp, 
				prop = pluralMapper[pathProp],
				getFilters = function (method) {
					var filters = [];
					filters.push(function (req,res,next) {
						if (controllers[prop] && controllers[prop].all && controllers[prop].all) {
							controllers[prop].all(req,res,next);
						} else {
							next();
						}
					});
					filters.push(function (req,res,next) {
						if (controllers[prop] && controllers[prop].filter && controllers[prop].filter.all) {
							controllers[prop].filter.all(req,res,next);
						} else {
							next();
						}
					});
					filters.push(function (req,res,next) {
						if (controllers[prop] && controllers[prop].filter && controllers[prop].filter[method]) {
							controllers[prop].filter[method](req,res,next);
						} else {
							next();
						}
					});
					return filters;
				};
				// add it to the children list
				children[name] = children[name] || {};
				children[name][prop] = true;
				
				if (_.includes(types,"get")) {
					method = "index";
					gf = (globalFilters.filter||{})[method];
					// because we do not know at this time if the property we are getting has its controller defined or not, 
					//   we need to defer until execution time by wrapping with a function
					mw = [].concat(middleware,gf||[],getFilters(method));
					app.get(fullPath,mw,function (req,res,next) {
						// get the instances of 'prop' where the value of the field for our name matches our ID
						var search = _.omit(req.query,function (val,key) {
							return(key.indexOf('$b.') === 0);
						});
						search[name] = req.params[pathName];
						req.booster.models[prop].find(search,function (err,data) {
							var sendit = function () {
								if (err) {
									res.status(400).send(err);
								} else if (data && _.size(data) > 0) {
									res.status(200).send(data);
								} else {
									next();
								}
							};
							// do we have post-processors?
							if (controllers && controllers[prop] && controllers[prop].post) {
								pp = [].concat( controllers[prop].post.all || [] ).concat( controllers[prop].post[method] || [] );
							}
							if (pp && pp.length > 0) {
								async.each(pp,function(item,callback){
									item(req,res,callback,data);
								},function (err,data) {
									if (err) {
										next(err);
									} else {
										sendit();
									}
								});
							} else {
								sendit();
							}
						});
					});
				}
				if (_.includes(types,"set")) {
					method = "update";
					//post = (c.post||{})[method];
					//pp = [].concat(processors,post || []);
					gf = (globalFilters.filter||{})[method];
					mw = [].concat(middleware,gf||[],getFilters(method));
					app.put(fullPath,mw,function (req,res,next) {
						var body = req.body ? [].concat(req.body) : [], search = {}, toRemove = [], toAdd = [], 
						existing = {}, newList = {}, parentId = req.params[pathName],
						// *** SHOULD USE REFERENCED ID!! ****
						idField = "id",
					
						// before anything, we must make sure that each item to be added/saved has the key of our name === req.params[name]
						badParent = _.filter(body,function (entry) {
							return (!entry || !entry[name] || entry[name] !== parentId);
						});
					
						if (badParent && badParent.length > 0) {
							res.status(400).send("field "+name+" in records must equal path value");
						} else {
							m = req.booster.models[prop];
							search[pathName] = parentId;
							m.find(search,function (err,data) {
								if (err) {
									res.status(400).send(err);
								} else {
									// hashify all the ones we found
									_.each(data,function (entry) {
										existing[hashify(_.omit(entry,idField))] = entry;
									});
									// hashify all of the new ones
									_.each(body,function (entry) {
										newList[hashify(_.omit(entry,idField))] = entry;
									});
							
									// toRemove are all of those that are in existing but not in newList
									_.each(existing,function (entry,key) {
										if (!newList[key]) {
											toRemove.push(entry[idField]);
										}
									});
									// toAdd are all of those in newList and NOT in existing
									_.each(newList,function (entry,key) {
										if (!existing[key]) {
											toAdd.push(entry);
										}
									});
			
									// now remove and add the ones we need
									async.series([
										function (cb) {
											async.each(toAdd,function (item,cb) {
												m.create(item,cb);
											},cb);
										},
										function (cb) {
											async.each(toRemove,function (id,cb) {
												m.destroy(id,cb);
											},cb);
										}
									],function (err,data) {
										if (err) {
											res.status(400).send(err);
										} else if (data) {
											res.status(200).send(data);
										} else {
											next();
										}
									});
								}
							});
						}
					});
				}
			});
		
			_.each(ctrlrRoutes.property,function (route,method) {
				var verb = route.toLowerCase();
				if (c[method] && typeof(c[method] === "function")) {
					app[verb](basePath+adder+":"+pathName+'/:prop123var'+format,middleware,c[method]);
				}
			});
		};
		name = trim(resourceName).replace(/^.*\//,"");
		if (name) {
			models[name] = m = loadModel(name,config.models+name,models,config.db);
			// make sure we have at least one opts object
			if (optsAry.length < 1) {
				optsAry.push({});
			}
			
			_.each(optsAry,function (opts,i) {
				opts.embed = opts.embed || config.embed;
				if (opts && opts.parent) {
					_.each(routes[opts.parent],function (parent,j) {
						loadPath(parent,opts);
					});
					// mark that the parent has a resource child named us
					children[opts.parent] = children[opts.parent] || {};
					children[opts.parent][name] = true;
				} else {
					loadPath("",opts);
				}
			});
		}
		return(this);
	},
	model: function(name) {
		models[name] = loadModel(name,config.models+name,models,config.db);
		return(this);
	},
	validator: require('./validator').validate,
	models: models
};
