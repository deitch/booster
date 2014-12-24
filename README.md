#booster


##Overview
Booster is the ***fastest*** way to get a full-fledged REST service up and running in [nodejs](http://nodejs.org)!

````JavaScript
var booster = require('booster'), express = require('express'), app = express(), db = require('./myDbSetup');

booster.init({app:app,db:db});
booster.resource('post');

// or
booster.init({app:app,db:db}).resource('post');


app.listen(3000);
````

Done! You now have a REST service listening on the five standard REST paths for 'post' and connecting to your database.

Want customized controllers? Disable some paths? Nest resources? Model validations? Uniqueness? Read on!

##Installation

````
npm install booster
````

Doesn't get easier than that!


##Usage
### What does it provide?
booster provides the following basic features:

* REST routing - similar to express-resource
* Easy controllers - with defaults for all patterns
* Standardized models - with validation, optional schemas, and database agnostic interfaces

### What does it look like?

````JavaScript
var express = require('express'), app = express(), booster = require('booster');

// set up my database
db = dbSetUp();
booster.init({app:app,db:db,controllers:'./controllers',models:'./models'});
booster.resource('post');
booster.resource('comment',{parent:'post'},{only:"index"});
booster.resource('note',{parent:'comment'});
booster.resource('test',{base:'/api'});

app.listen(3000);
````

You now have a RESTful app that listens on the following verb/path/action

    GET       /post                           post#index()
    GET       /post/:post                     post#show()
    POST      /post                           post#create()
    PUT       /post/:post                     post#update()
    PATCH     /post/:post                     post#patch()
    DELETE    /post/:post                     post#destroy()
		GET       /post/:post/comment             comment#index()
		GET       /post/:post/comment/:comment    comment#show()
		POST      /post/:post/comment             comment#create()
		PUT       /post/:post/comment/:comment    comment#update()
		PATCH     /post/:post/comment/:comment    comment#patch()
		DELETE    /post/:post/comment/:comment    comment#destroy()
		GET       /comment             						comment#index()
		GET       /post/:post/comment/:comment/note					note#index()
		GET       /post/:post/comment/:comment/note/:note		note#show()
		POST      /post/:post/comment/:comment/note/:note		note#create()
		PUT       /post/:post/comment/:comment/note/:note   note#update()
		PATCH     /post/:post/comment/:comment/note/:note   note#patch()
		DELETE    /post/:post/comment/:comment/note/:note   note#destroy()
    GET       /api/test                       test#index()
    GET       /api/test/:test                 test#show()
    POST      /api/test                       test#create()
    PUT       /api/test/:test                 test#update()
    PATCH     /api/test/:test                 test#patch()
    DELETE    /api/test/:test                 test#destroy()

and where exactly are those `post#index()` and `comment#show()` functions? You can create them or use the defaults:

If you create them, they are in `<controllerPath>/post.js` and `<controllerPath>/comment.js`. So `post#index()` is just the method `index()` on the `module.exports` of `<controllerPath>/post.js`. 

And if you don't create them? Well, then **booster** has built-in defaults!

For example, calling `GET /post` with no `<controllerPath>/post.js` defined, or without the `index()` function defined, will simply load the list of posts from the database and send them all.



### Getting started
````JavaScript
var booster = require('booster');
````

That shouldn't surprise anyone!

So what do I do with `booster` once I have `require`d it?

````JavaScript
booster.init(config); // returns booster, so you can chain
````

And what exactly goes in that config, anyways?

* `controllers`: path to controller files directory, relative to app root, e.g. `./ctrlr` (trailing slash is optional). Default is './routes', but **controllers are totally optional**.
* `models`: path to model files director, relative to app root, e.g. `./mymodels` (trailing slash is optional). Default is './models', but **models are totally optional**.
* `param`: parameters you want to make available to controller functions. Optional. Default is `{}`.
* `db`: a database object. Required.
* `app`: your express app object (you really should have one of these!). Required.


### REST Resources
The basic step is defining a REST resource, like so:

    booster.resource(name,opts[,opts,opts...]); // returns booster, so you can chain

For example:

    booster.resource('comment');
		
This sets up a resource named 'comment', expecting a controller (or using the default) for comment, and a model (or using the default) for comment. As shown above, it creates six paths by default:

    GET       /comment             comment#index()
    GET       /comment/:comment    comment#show()
    POST      /comment             comment#create()
    PUT       /comment/:comment    comment#update()
    PATCH     /comment/:comment    comment#patch()
    DELETE    /comment/:comment    comment#destroy()


#### Name of the rose. I mean resource.
The first (and only required) argument to `booster.resource()` is the name of the resource. It should be all string, valid alphanumeric, and will ignore all leading and trailing whitespace. It will also ignore anything before the last slash, so:

    abc     -> abc
		/abc    -> abc
		a/b/c   -> c
		ca/     -> INVALID


#### Format extension
Many apps, rather than having the path `/comment/:comment` prefer the format `/commen/:comment.:format?`. This means that both `/comment/1` **and** `/comment/1.json` would be acceptable.

booster supports the format extension out of the box. If you need access to the parameter in your controller, it is in `req.params.format`. Of course, it is optional!

#### Search Params
When you do a `GET` to a resource collection - e.g. `GET /comment` as opposed to `GET /comment/1` - you can pass search parameters to the query. 

**All** query parameters passed to the request will be passed to `model.find()`, and by extension `db.find()`, **except** for ones specific to the controller. Controller parameters always start with `$b.`, e.g. '$b.csview'. 


#### Responses
Each type of http verb gives the appropriate response, with some options to change globally or per-request.

|Verb|Success HTTP Code|Success Body|Failure Code|Failure Body|
|----|-----------------|------------|------------|------------|
|`GET` index|200|Array of objects|400,404|Error Message or blank|
|`GET` show|200|Object or array of objects|400,404|Error Message or blank|
|`POST`|201|ID of created object|400,404|Error message or blank|
|`PUT`|200|ID of updated object *OR* updated object|400,404|Error message or blank|
|`PATCH`|200|ID of updated object *OR* updated object)|400,404|Error message or blank|
|`DELETE`|204||400,404|Error message or blank|

##### GET after PUT/PATCH
`PUT` and `PATCH` return the ID of the updated object in the body of the response. Sometimes, though, you prefer to have the request return the updated object in its entirety in the body.

There has been extensive debate among the REST community which is the correct response. booster is smart enough not to take sides in this debate and support both options. By default, successful `PUT`/`PATCH` return the ID of the updated object as the body of the response.

If you want a successful `PUT`/`PATCH` to return the body - as if you did the successful `PUT`/`PATCH` and then followed it up with a `GET` - you have 3 options:

* global: by making it the default server-side in your booster initialization settings.

````JavaScript
booster.init({sendObject:true});
````

* param: as part of the request in the URL, add `sendObject=true` to the request.

````
PUT http://server.com/api/user/1?sendObject=true
````

* header: as part of the request in the headers, add a header `X-Booster-SendObject: true` to the request.

````
X-Booster-SendObject: true

PUT http://server.com/api/user/1
````

As a rule of thumb:

1. URL param takes precedence over...
2. HTTP header, which takes precedence over...
3. booster initialization setting, which takes precedence over...
4. booster default

The following table lays out the results of a `PUT`/`PATCH`:


|booster init|http header|param|send object?|
|---|---|---|---|
||||NO|
|||`sendObject=true`|YES|
||`X-Booster-SendObject: true`||YES|
||`X-Booster-SendObject: true`|`sendObject=true`|YES|
||`X-Booster-SendObject: false`|`sendObject=true`|YES|
||`X-Booster-SendObject: true`|`sendObject=false`|NO|
||`X-Booster-SendObject: true`|`sendObject=false`|NO|
|{sendObject:true}|||YES|
|{sendObject:true}|`X-Booster-SendObject: false`||NO|
|{sendObject:true}||`sendObject=false`|NO|
|{sendObject:true}|`X-Booster-SendObject: false`|`sendObject=true`|YES|
|{sendObject:true}|`X-Booster-SendObject: true`|`sendObject=false`|NO|
|{sendObject:false}|||NO|
|{sendObject:false}||`sendObject=true`|YES|
|{sendObject:false}|`X-Booster-SendObject: true`||YES|
|{sendObject:false}|`X-Booster-SendObject: true`|`sendObject=true`|YES|
|{sendObject:false}|`X-Booster-SendObject: false`|`sendObject=true`|YES|
|{sendObject:false}|`X-Booster-SendObject: true`|`sendObject=false`|NO|
|{sendObject:false}|`X-Booster-SendObject: true`|`sendObject=false`|NO|

NOTE: booster init setting `{sendObject:false}` is the same as not setting an init param at all.


#### Optional options
`opts` is just a plain old JavaScript object with options. What goes into those options? That depends what you want to do with this resource and what path it should have.

You can have the resource accessible from multiple paths and behave differently in each of those paths, by having multiple `opts`. First, let's see what you can do with each opts, then we'll string multiple together.

##### Base path
If you prefer to have a base path to your resource, so the path is `/api/comment`, just do:

    booster.resource('comment',{base:'/api'});
		

Which will give you
    
		GET       /api/comment             comment#index()
    GET       /api/comment/:comment    comment#show()
    POST      /api/comment             comment#create()
    PUT       /api/comment/:comment    comment#update()
    PATCH     /api/comment/:comment    comment#patch()
    DELETE    /api/comment/:comment    comment#destroy()


If you want **all** of your routes to have a base path, instead of having to do:

    booster.resource('post',{base:'/api'});
    booster.resource('comment',{base:'/api'});
    booster.resource('user',{base:'/api'});
		
You could simply do:

    booster.init({base:'/api'});
    booster.resource('post');
    booster.resource('comment');
    booster.resource('user');

If you *do* specify a `base` on a specific resource *after* already specifying the global `base` in `init()`, the resource-specific `base` will override the global one.

##### Different path name
Sometimes, you want to name your resource one thing, while the path to it should be something else. This is useful when you have multiple paths to a resource, or if the actual name of the path might conflict with an existing resource. 

For example, what if you wanted to have a resource called 'user' under a 'post', but it is different than the actual user resource.

    GET       /post             			post#index()
    GET       /post/:post		    			post#show()
		GET				/post/:post/user				diffuser#index()
		GET				/post/:post/user/:user	diffuser#show()

To enable it, you use the `name` option:

    booster.resource('diffuser',{parent:'post',name:'user'});

This will create the above paths. Note that the name of the parameter will be `:user` and not `:diffuser`.
However, it will expect a controller file, if any, to be named `diffuser.js`, since that is the name of the resource.

##### Nested Resource
If you want to nest a resource, like in the example above, you just need to pass a `parent` option:

    booster.resource('comment',{parent:'post'});

Which will give you

    GET       /post/:post/comment             comment#index()
    GET       /post/:post/comment/:comment    comment#show()
    POST      /post/:post/comment             comment#create()
    PUT       /post/:post/comment/:comment    comment#update()
    PATCH     /post/:post/comment/:comment    comment#patch()
    DELETE    /post/:post/comment/:comment    comment#destroy()

If you include *both* `parent` *and* `base`, it will ignore `base`.

You can nest as many layers deep as you want:

````JavaScript
booster.resource('comment',{parent:'post'});
booster.resource('note',{parent:'comment'});
````


````
GET       /post/:post/comment             comment#index()
GET       /post/:post/comment/:comment    comment#show()
POST      /post/:post/comment             comment#create()
PUT       /post/:post/comment/:comment    comment#update()
PATCH     /post/:post/comment/:comment    comment#patch()
DELETE    /post/:post/comment/:comment    comment#destroy()
GET       /post/:post/comment/:comment/note					note#index()
GET       /post/:post/comment/:comment/note/:note		note#show()
POST      /post/:post/comment/:comment/note/:note		note#create()
PUT       /post/:post/comment/:comment/note/:note   note#update()
PATCH     /post/:post/comment/:comment/note/:note   note#patch()
DELETE    /post/:post/comment/:comment/note/:note   note#destroy()
````

###### Required Parent Param
Sometimes, you want to require that a nested resource has a property that matches the parent.

For example, if I am creating a new nested comment on post 2 as follows:

    POST /post/2/comment {author:"john",content:"This is a comment"}

I might want the content to *require* the name of the parent as a property:

    {author:"john",content:"This is a comment",post:"2"}
		
booster can enforce this if you tell it to! When sitting up a nested resource, just set the `parentProperty` to `true` as follows:

````JavaScript
booster.resource('comment',{parent:'post',parentProperty:true});
````

If `parentProperty` is set to `true`, booster will *insist* that the posted body contains a property with the same name as the parent, and that its value precisely matches the value of the parent parameter. In other words, it will insist that `req.params[parent] === req.body[parent]`. If not, it will reject it with a `400` error.

This rule is enforced for *all* `POST`, `PUT` and `PATCH`.

If you have:

````JavaScript
booster.resource('post');
booster.resource('comment',{parent:'post',parentProperty:true});
````

each of the following examples, it will show what works and what doesn't

````
POST   /post/3/comment    {post:"4"}  // FAIL: "4" !== "3"
POST   /post/3/comment    {post:"3"}  // PASS: "3" === "3"
POST   /post/3/comment    {}          // FAIL: missing "post" property
PUT    /post/3/comment/4  {post:"4"}  // FAIL: "4" !== "3"
PUT    /post/3/comment/4  {post:"3"}  // PASS: "3" === "3"
PUT    /post/3/comment/4  {}          // FAIL: missing "post" property and PUT means replace entirely
PATCH  /post/3/comment/4  {post:"4"}  // FAIL: "4" !== "3"
PATCH  /post/3/comment/4  {post:"3"}  // PASS: "3" === "3"
PATCH  /post/3/comment/4  {}          // PASS: missing "post" property, but PATCH is only an update, not a replace
````

Note that for POST or PUT, where the body is the entire new or replacement object, the property *must* exist, else it fails. However, for PATCH, where it only replaces those explicit fields, it the parent property is missing, it passes.

In the case of POST and PUT, if you want the field to default to the value of the parent property  - in our above example, `{post:"3"}` - you can tell booster, "Hey, the field has to match, but if it isn't there at all, fill it in for me." Just tell the resource, in addition to setting `parentProperty` to `true`, set `parentDefault` to `true` as well:

````JavaScript
booster.resource('post');
booster.resource('comment',{parent:'post',parentProperty:true,parentDefault:true});
````

In that case, all of the above examples where missing `post` caused the route to fail with a `400` will now pass, and the value will be set:

````
POST   /post/3/comment    {}          // PASS: will be sent to the model as {post:"3"}
PUT    /post/3/comment/4  {}          // PASS: will be sent to the model as {post:"3"}
````

Note that if you have a property set to `{mutable:false}` and the same property is `{parentDefault:true}`, it might conflict when doing a `PUT`. `POST` will never be a problem, since it does not yet exist, and `PATCH` is not a problem, since it only updates the given fields.

For example, what if the data in the database is:

    {id:"1",post:"3",content:"Hello, I am here"}
		
and you initialize as

````JavaScript
booster.resource('comment',{parent:'post',parentProperty:true,parentDefault:true});
````

If you do 

    PUT /post/3/comment/1  {content:"Now I am not"}
		
booster will look at the update  (`PUT`) to comment with the id "1", see that it requires the parent property ("post") but that it isn't present, so it will add `{post:"3"}` before updating the model. This is the equivalent of:

    PUT /post/3/comment/1  {content:"Now I am not",post:"3"}

This is great, but what if you defined the `comment` model making `post` immutable:

````JavaScript
module.exports = {
	fields: {
		content:{required:true,mutable:true},
		post: {required:true,mutable:false},
		id: {required:true,mutable:false}
	}
}
````

After all, you do *not* want someone accidentally moving a comment from one post to another! But then the update of

    PUT /post/3/comment/1  {content:"Now I am not",post:"3"}
		
will cause a `400` error, since it is trying to update the `post` property, and that one is immutable! 

Not to worry; booster inteillgently handles this. If you actually *try* to update `post`, it will throw a `400`. But if you did not set it, and you have `parentDefault` set, it will not set it unless the field is mutable.


##### Resource Property
What if you don't want to create a whole new resource, but have a separate property as part of a resource? For example, if you want to be able to `PUT /post/:post/title` and so change the title directly?

It already works! Yes, that's right. If you already created the resource `booster.resource('post')`, then unless you created a nested resource of exactly the same name, `GET /post/:post/title` will get you the title from `/post/:post` Similarly, you can `PUT /post/:post/title` to change it. But, no you cannot `POST` or `PATCH` it; they don't make much sense.

And you get all of the validations of models for free!

What if you don't want this to happen? Just set it in the controller:

````JavaScript
module.exports = {
	getProperty: null // disable `GET /post/:post/property`
	setProperty: null // disable `PUT /post/:post/property`
}
````

##### Custom Properties
OK, so the above works great if you want `/post/1/title` to map to `title` of post 1, or `/post/10/author` to map to `author` of post 10. But what if you want all of the above **and** you want to map some special properties to their own handlers. For example, if a user is:

    {id:"1",firstname:"john",lastname:"smith"}

so you want the following to work (and hey, booster *already* said you get it for free):

    GET /user/1/firstname -> "john"
		GET /user/1/lastname -> "smith"
		GET /user/1 -> {id:"1",firstname:"john",lastname:"smith"}

But you *also* want to be able to do:

    GET /user/1/groups -> [10,12,2678]
		
In other words, that special property `groups` is really not a property of a `user` object, but has its own logic. On the other hand, it behaves mightily like a property: it uses `PUT` and `GET`, and has meaning only in the context of a specific `user`. It isn't a first-class resource (the `group` and the `user` are), but that array of group IDs comes from somewhere else!

You know that I'm going to say, "it's easy!", right?

All you need to do is put in place that special controller file, and add `properties` to it.

````JavaScript
module.exports = {
	properties: {
		groups: {
			get: function(req,res,next) {
				// do all of your get logic here
				// LOGIC A
			},
			set: function(req,res,next) {
				// do all of your set logic here
				// LOGIC B
			}
		},
		roles: {
			get: function(req,res,next) {
				// LOGIC C
			}
		},
		strange: {
			set: function(req,res,next) {
				// LOGIC D
			}
		}
	}
};
````

So when booster hits a property of a resource, like `/user/1/someProperty`, it says, if *all* of the following is true, use your function, else treat it just like a regular property:

    (controller file exists) AND 
		  (controller has "properties" key) AND 
			  ("properties" key has appropriate property name) AND 
				  (  (property name has "get" key as function if request was GET) OR 
					   (property name has "get" key as function if request was PUT)  )


Going back to the above example, here is what will happen with each type of request and why:

    GET /user/1/title -> get the property "title" of the object; properties.title not defined
    GET /user/1/groups -> use function for LOGIC A; properties.groups.get defined
    PUT /user/1/groups -> use function for LOGIC B; properties.groups.set defined
    GET /user/1/roles -> use function for LOGIC C; properties.roles.get defined
    PUT /user/1/roles -> get property "roles" of the object; properties.roles.set not defined
    GET /user/1/strange -> get property "strange" of the object; properties.strange.get not defined
    PUT /user/1/strange -> use function for LOGIC D; properties.strange.set defined


######  Resource as a Property (RaaP?)
Actually, it is even **easier**! A really common pattern is where a property of one resource is actually a reference to another resource that has some find restrictions. Take a look at the following:


    GET /group         -> get all of the groups
		GET /group/10      -> get group whose ID is 10
    GET /user/1/name   -> get the name of user 1, normal property
		GET /user/1/group -> Get all of the groups of which user "1" is a member, like GET /group?{user:1}


Since this is such a common pattern, let's make it easier for you!

````JavaScript
booster.resource('group');
booster.resource('user',{resource:{group:["get"]}});
````

That is exactly the same as the following:

````JavaScript
booster.resource('group');
booster.resource('user');

// and inside routes/user.js :
module.exports = {
	properties: {
		group: {
			get: function(req,res,next) {
				// get the groups of the user from the separate groups list and send them off
				req.booster.models.group.find({user:req.params.user},function (err,data) {
					if (err) {
						res.send(400,err);
					} else if (data && _.size(data) > 0) {
						res.send(200,data[0]);
					} else {
						next();
					}
				});
				
			}
		}
	}
}
````

But come on, is that not *so* much easier? You want to write 17 lines instead of 2, and in 2 different files? Go ahead. But I think 2 lines is just cooler.


What about the easier set? Can we do that? You know we can!

````JavaScript
booster.resource('group');
booster.resource('user',{resource:{group:["set"]}});
````

This means, "whatever I sent in the body to `/user/1/group` should be all of the groups that have `{user:1}` in them, no more, no less."

It is exactly the same as the following:

````JavaScript
booster.resource('group').resource('user');

// and inside routes/user.js :
module.exports = {
	properties: {
		group: {
			set: function(req,res,next) {
				var body = req.body ? [].concat(req.body) : [];
				req.booster.models.group.find({user:req.params.user},function (err,data) {
					var toRemove = [], toAdd = [];
					if (err) {
						res.send(400,err);
					} else {
						// add to toRemove all of those that are in data but not in body
						// add to toAdd all of those that are in body but not in data
						
						// now to the removal and creation
						async.series([
							function (cb) {
								async.each(toAdd,function (item,cb) {
									that.create(item,cb);
								},cb);
							},
							function (cb) {
								async.each(toRemove,function (item,cb) {
									that.destroy(item.id,cb);
								},cb);
							}
						],callback);						
					}
				});
			}

		}
	}
}
````


##### Root path
If you want to have the resource called at the root path, you just need to pass a `root` option:

    booster.resource('comment',{root:true})

Which will give you

    GET       /             comment#index()
    GET       /:comment     comment#show()
    POST      /             comment#create()
    PUT       /:comment     comment#update()
    PATCH     /:comment     comment#patch()
    DELETE    /:comment     comment#destroy()

Notice that the resource itself is still `comment`, but the path does not include the name `comment`.


#### Multiple Paths / Options
If you want a resource to exist in multiple locations, each with different (or similar) behaviour, you specify multiple options objects. 

Let's say you want "post" to exist in 2 places:

    GET /post								post#index()
		GET /post/:post					post#show()
    GET /api/post						post#index()
		GET /api/post/:post			post#show()

Each "post" refers to the same resource, but is accessible at different paths. Perhaps you only allow updates at one path but not the other, e.g. if comments have a unique ID, so you can retrieve comments from anywhere, but update only via the "post":

    GET /post/:post/comment							comment#index()
    GET /post/:post/comment/:comment		comment#show()
    PUT /post/:post/comment/:comment		comment#update()
    PATCH /post/:post/comment/:comment	comment#patch()
    DELETE /post/:post/comment/:comment	comment#destroy()
		GET /comment/:comment								comment#show()

These are the same "comment" resources, but accessible via different paths. All you need to do is have an `opts` for each one of them when declaring the resource.

````JavaScript
booster.resource("post");
booster.resource('comment',{parent:"post"},{only:"show"});
````

The first options object `{parent:"post"}` sets up the path for a "comment" as child of a parent as `/post/:post/comment`. The second `{only:"show"}` sets up the path for a "comment" at the root, but only exposes "show". 

**Note:** Normally, if you want an unmodified resource at the base path, you don't need to set options at all, just do `booster.resource('comment');`. However, with multiple options, booster *cannot* know that there is *also* a base path 'comment'. Thus, with multiple options, you **must** specify a blank options `{}` for base path. For example:

````JavaScript
booster.resource("post");
booster.resource('comment',{parent:"post"},{}); // the second one is like booster.resource('comment');
````


### Controllers
The default controller provides the standard actions: index, show, create, update, patch, destroy. It interacts with the models of the same name (see *models*, below), and lists all of them, shows one, creates a new one, updates an existing one, or destroys one.

#### Customizing and Eliminating Actions

If you want to override one or more of the actions, just create a file with that name in *controllerPath* directory, either the default path or the one you provided when initializing booster. Each function should match express route signature. If you want to eliminate a route entirely, override it with a `null`. See the example below.

````JavaScript
// <controllerPath>/post.js
module.exports = {
	index: function(req,res,next) {
		// do lots of stuff here
	}
	// because we only override index, all of the rest will just use the default
	update: null
	// because we actively made update null, the update() function and its corresponding PUT /post/:post will be disabled and return 404
};
````

##### Shortcuts

You can also take a shortcut to eliminating a route, using the `except` and `only` configuration parameter:

````JavaScript
booster.resource('post',{except:"index"}); // will create all the routes except GET /post
booster.resource('post',{except:["update","patch"]}); // will create all the routes except PATCH /post/:post and PUT /post/:post
booster.resource('post',{only:"index"}); // will eliminate all the routes except GET /post
booster.resource('post',{only:["update","patch"]}); // will eliminate all the routes except PATCH /post/:post and PUT /post/:post
````

Note that if you are eliminating just one route, or keeping just one route, you can put it in an array, or just as a string.

If you use both `only` and `except`, the `except` **will be ignored**. In English, `only` means, "only this and no others", while `except` means, "all the others except this". These are mutually conflicting.


#### What does the default controller do?
Well, it looks like this but with real error-handling. Look at the source code in github if you want the real nitty-gritty.

````JavaScript
module.exports = {
	index: function(req,res,next) {
		var data = model.find();
		res.send(200,data);
	},
	show: function(req,res,next) {
		var data = model.get(req.param(resource)); // 'resource' is the name you provided when you called booster.resource(name);
		res.send(200,data);
	},
	create: function(req,res,next) {
		model.create(req.body,function(){
			res.send(201);
		});
	},
	update: function(req,res,next) {
		model.update(req.body.id,req.body,function(){
			res.send(200);
		});
	},
	patch: function(req,res,next) {
		model.patch(req.body.id,req.body,function(){
			res.send(200);
		});
	},
	destroy: function(req,res,next) {
		model.destroy(req.param.id,function(){
			res.send(204);
		});
	}
};
````

It just calls the basic model functions.

#### Access models inside the controllers
If you need to access the model classes inside the controllers, no problem. They are always available on a request at `req.booster.models`. Each named `resource` has its own object.

````JavaScript
booster.resource('user');

index: function(req,res,next) {
	var User = req.booster.models.user;
}
````

**Note**: `req.booster` is available in *all* express routes, not just those inside booster controllers. For example:

````JavaScript
booster.resource('user');

app.get('/foo',function(req,res,next){
	req.booster.models.user(); // this works here!
});
````

#### Parameters to controller functions
And what if you want to pass some parameters to controller functions? For example, what if one of your controller functions needs to send emails, and you just happen to have a `sendmail` object in your app that knows how to do just that?

Well, you could `require()` it in each controller, but that really is rather messy, requires multiple configurations and calls (not very [DRY](http://en.wikipedia.org/wiki/Don't_repeat_yourself)), and would work much better if you could just inject the dependency.

booster supports that type of dependency injection. If you have configuration parameters you want available to your controllers, they are available, in true express style, on the `req` object as `req.booster.param`. You inject them by using the `param` property when calling `booster.init()`

````JavaScript
booster.init({param:{sendmail:fn}});

index: function(req,res,next) {
	req.booster.param.sendmail();
	// do lots of stuff here
}
````

#### Filters
Now, what if you don't want to entirely override the controller function, but perhaps put in a filter. You could easily just do:

````JavaScript
module.exports = {
	show: function(req,res,next) {
		// handle everything here
	}
}
````

But you didn't want to have to recreate all of the model calls, error handling, all of the benefits of the default controller. You really just wanted to inject some middleware *prior* to the default `show()` being called!

Booster gives you two really good options for this: `all` global filter, and `filters` for individual ones.

##### Global 'before' option for controllers
If you are writing controller method overrides, and you want a function that will always be executed *before* the usual index/show/update/create/destroy, just add an `all` function.

````JavaScript
module.exports = {
	all: function(req,res,next) {
		// stuff here will always be done *before* the usual middleware methods
		next();
	}
};
````



##### Individual filters
If you want an individual filter to run on only one specific routing, e.g. `user.index()` or `user.show()`, you do the following:

````JavaScript
module.exports = {
	filter: {
		show: function(res,res,next) {
			// do your filtering here
			// succeeded?
			next();
			// failed?
			res.send(400);
			// or else
			next(error);
		}
	}
};
````

Of course, you will ask, why the split language? Why is `all` a first-level property, but each other filter is below the `filter` property? Well, all can go in either space. Both of the following are valid:

````JavaScript
module.exports = {
	// this one will get executed first
	all: function(res,res,next) {
		next();
	},
	filter: {
		// then this one
		all: function(res,res,next) {
			next();
		},
		// and this one last
		show: function(req,res,next) {
		}
	}
};
````

The order of execution is:

1. `all()`
2. `filter.all()`
3. `filter.show()` (or any other specific one)

**Note:** Filters will run, independent of any path you use to access the resource. So if you have the following defined for comment:

    booster.resource('comment',{},{parent:'post'});
		booster.resource('foo',{resource:{comment:['get']}});
		
Then you have three paths to list `comment`:

* `/comment`
* `/post/:post/comment`
* `/foo/:foo/comment`

In all three paths, any filters defined for `comment` will run, whether it is top-level `all`, `filter.all`, or path specific, such as `filter.index` or `filter.show`:

    all: function(req,res,next) {
			// do some filtering
		},
		filter: {
			all: function(req,res,next) {
				// do some other filtering
			},
			index: function(req,res,next) {
				// filter on /comment or /post/:post/comment or /foo/:foo/comment
			}
		}


#### Global Filters
If you want to have filters that run on *all* resources, the above method will work - create a controller file for `resourceA` and another for `resourceB` and for `resourceC`, but that is pretty repetitive (and therefore not very DRY).

A better solution is "global filters". Global filters look *exactly* like per-resource filters, and have the exact same file structure - `all`, `filter.all`, `filter.show`, etc. - but apply to every resource. To enable it, when initializing booster, just tell it where it is:

    booster.init({filters:'/path/to/global/filters/file'});
		
It is that simple!

The order of execution is:

1. global `all()`
2. global `filter.all()`
3. global `filter.show()` (or any other specific one)
4. controller-specific `all()`
5. controller-specific `filter.all()`
6. controller-specific `filter.show()` (or any other specific one)


#### Post-Processors
A common use case is one where you want to do some post-processing *before* sending the response back to the client, for example, if you `create` with `POST /users` but before sending back that successful `201`, you want to set up some activation stuff, perhaps using [activator](http://github.com/deitch/activator). Like with filters, you *could* override a controller method, like `create`, but then you lose all of the benefits.

The solution here is post-processors, methods that are called *after* a successful controller method, but *before* sending back the `200` or `201`. Does booster support post-processors? Of course it does! (why are you no surprised?)

Like filters, post-processors are added as properties of the controller object.

````JavaScript
module.exports = {
	// use "post" to indicate post-processors
	post: {
		all: function(req,res,next) {},  // "all" will always be called
		create: function(req,res,next) {}, // "create" will be called after each "create"
	}
};
````

The order of execution is:

1. `post.all()`
2. `post.create()` (or any other specific one) 

Post-processor signatures look slightly different than most handlers, since they need to know what the result of the normal controller method was.

````JavaScript
function(req,res,next,status,body) {
};
````

`req`, `res`, `next` are the normal arguments to a route handler. `status` is the status code and `body` is the body returned by the controller method, if any. 

Your post-processor filter has 3 options:

* Do nothing: if it does not alternate the response at all, just call `next()` as usual.
* Error: as usual, you can always call `next(error)` to invoke expressjs's error handler.
* Change the response: if it want to alternate the response, call `res.send()` or anything else. 



And what about all of our models? What do we do with them?


### Models
Models are just standard representations of back-end data from the database. Like controllers, models are completely optional. If you don't provide a model file, the default will be used. If you prefer to design your own, create it in *modelPath* directory, either the default or the one you provided when initializing booster.

So what is in a model? Actually, a model is an automatically generated JavaScript object handler. It is driven by a config file in which you tell it which you tell booster, for this particular model, how to manage data: name in the database, id field, validations, what should be unique, etc.

* name: what the name of this model should be in your database. Optional. Defaults to the name of the file, which is the name of the `resource` you created in `booster.resource('name')`.
* fields: what fields this model should have, and what validations exist around those fields
* unique: what unique fields need to exist for this model
* id: what the ID field is. We need this so that we can use "unique" comparisons and other services. Optional. Defaults to "id".
* presave: a function to be executed immediately prior to saving a model via update or create. Optional.
* extend: an object, with functions that will extend the model. Optional. See below.

An actual model instance is just a plain old javascript object (POJSO). The data returned from the database to a controller should be a POJSO, as should the data sent back.

#### name
The `name` is just an identifier for this model, and is optional. It defaults to the name of the file, which is the name of the resource you created. 

It is used, however, as the value of the `table` passed to all the database calls. See below under Persistence.

#### fields
The `fields` is a list of all of the required fields and properties that are used for this model. It includes the following:

* required: boolean, if the field is required. Ignored for PUT updates. Default `false`
* createblank: boolean, if this field is optional during creation. ignored if `required === false`. Default `false`
* mutable: boolean, if the field can be changed by a client request. Default `true`
* visible: this field is one of: public (visible to all), private (visible only for explicit private viewers), secret (never sent off the server)
* validation: validations to which to subject this field
* type: if this field should be a particular type. If it is, then when doing a `find()`, it will cast it to the appropriate type, if possible.

Example: 
````JavaScript
fields = {
	id: {required: true, createoptional: true, mutable: false, visible: "public"},
	name: {required: true, mutable:false, visible: "public", validation:["notblank","alphanumeric"]},
	email: {required: true, mutable:true, visible: "public", validation:"email"},
	time: {required:true,mutable:true,type:"integer"}
}
````

The `required` boolean is ignored in two cases:

1. PUT update: This makes sense. You might be updating a single field, why should it reject it just because you didn't update them all? If the `name` and `email` fields are required, but you just want to update `email`, you should be able to `PUT` the follwing `{email:"mynewmail@email.com"}` without triggering any "missing field required" validation errors.
2. POST create and `createoptional === true`: If you flag a field as `required`, but also flag it as `createoptional`, then if you are creating it, validations will ignore the `required` flag. Well, that's why you set it up as `createoptional` in the first place, right?


#### Validations
Validations are one of:

* Predefined validations that you can use to check the field
* An arbitrary function that you can define to validate and even manipulate the field

##### Predefined validations
Predefined validations are a single string or an array of strings that name validations to which to subject each model *before* sending persisting them to the database or accepting them from the database. 


The following validations exist as of this writing:

* `notblank`: Is not null, undefined or a string made up entirely of whitespace
* `notpadded`: Does not start or end with whitespace
* `email`: Is a valid email pattern. Does *not* actually check the email address. For example, `fooasao12122323_12saos@gmail.com` is a valid email pattern, but I am pretty sure that the address is not in use.
* `integer`: must be a valid integer
* `alphanumeric`: must be a valid alphanumeric `a-zA-Z0-9`
* `string`: must be a string
* `boolean`: must be a boolean `true` or `false`
* `array`: must be an array
* `integerArray`: must be an array, every element of which must be a valid integer
* `stringArray`; must be an array, every element of which must be a valid alphanumeric
* `unique`: must be an array, no element of which may be repeated more than once
* `minimum:<n>`: must be a string of minimum length `n`

If two or more validations are provided in an array, then **all** of the validations must pass (AND).

###### unique
If you want to check, before saving an object, that certain fields are unique - e.g. you don't want to create two objects with the same email - you can tell booster to check for you. It uses the `db.find()` function, creating a `search` to check.

The `unique` field is an array, the elements of which are either strings or arrays of strings. Let's look at a few examples:

###### One field
If you want just one field to be unique, like `email`, then just put it there:

````JavaScript
unique: ["email"]
````

If you create a model of type `user` `{name:"john",email:"john@gmail.com"}`, and have the above unique parameter, then before saving, booster will do the following:

````JavaScript
db.find('user',{email:"john@gmail.com"},callback);
````

Only if it finds no matches at all, will it proceed to save/update/create the model.

###### Two fields, both of which must be unique
If you want to make sure that two fields are not repeated, like `email` and `user`, then put them both in:

````JavaScript
unique: ["email","name"]
````

If you create a model of type `user` `{name:"john",email:"john@gmail.com"}`, and have the above unique parameter, then before saving, booster will do the following:

````JavaScript
db.find('user',{email:"john@gmail.com","name":"john","_join":"OR"},callback);
````

Only if it finds no matches at all, will it proceed to save/update/create the model.

###### Two fields, which must be unique in combination
If you want to make sure that two fields are unique in combination, for example if `firstName` can be repeated, and `lastName` can be repeated, but the combination cannot, then put them in their own array.

````JavaScript
unique: [["email","name"]]
````

If you create a model of type `user` `{firstName:"John",lastName:"Smith"}`, and have the above unique parameter, then before saving, booster will do the following:

````JavaScript
db.find('user',{email:"john@gmail.com","name":"john","_join":"AND"},callback);
````

Only if it finds no matches at all, will it proceed to save/update/create the model.

##### Validation Functions
Sometimes, the pre-defined validations just are not enough. You want to define your own validation functions. No problem! Instead of a string or array of strings, simply define a function, like so:

````JavaScript
module.exports = {
	fields: {
		id: {required:true, validation: "integer"},
		name: {required:true, validation: "alphanumeric"},
		password: {required:true, validation: function(name,field,mode,attrs){
			// do whatever checks and changes you want here
		}}
	}
}
````

The validation function provides several parameters:

* name: name of the model class you are validating, e.g. 'user' or 'post', helpful for generic functions.
* field: name of the field you are validating, helpful for generic functions. 
* mode: what we were doing to get this mode for validating, helpful if you need to validate some things on save, but not load. One of: `find` `get` `update` `create` 'patch`` (which are the exact `db` methods. Smart, eh?)
* attrs: the JavaScript object you are validating.
* callback: OPTIONAL. Async callback.

And what should the validation function return? It can return one of three things:

* `true`: the validation passed, go ahead and do whatever else you were going to do
* `false`: the validation did **not** pass, call the callback with an error indicating
* `object`: the validation might or might not have passed, but we want to do some more work:

The returned object should have the following properties:

* valid: `true` or `false` if the validation passed
* value: if this exists, then the value of this key on the object *should be changed* to the provided value before moving on. See the example below.
* message: if the validation failed (`valid === false`), then this is the message to be passed

###### Sync/Async
Note that a validation function can be synchronous or asynchronous. 

* Sync: If the arity (number of arguments) of a validation function is **four**, then it is treated as *synchronous*, and the validation return is the *return value of the function*.
* Async: If the arity of a validation function is **five**, then it is treated as *asynchronous*, and the fifth argument is the callback function. The callback function should have one argument exactly, the `true/false/object` that would be returned.

Note that sync is likely to be deprecated in future versions.


The classic example for this is a `password` field. Let's say the user updated their password, we don't just want to validate the password as alphanumeric or existing, we want to do two special things:

1. We want to validate that the password is at least 8 characters (which john's new password is not)
2. We want to one-way hash the password before putting it in the database

Our validation function will look like this:

````JavaScript
module.exports = {
	fields: {
		id: {required:true, validation: "integer"},
		name: {required:true, validation: "alphanumeric"},
		password: {required:true, validation: function(name,field,attrs){
			var valid, newpass = attrs[field];
			// in create or update, we are OK with no password, but check length and hash it if it exists
			if (mode === "create" || mode === "update") {
				if (newpass === undefined) {
					valid = true;
				} else if (newpass.length < 8>) {
					valid = {valid:false,message:"password_too_short"};
				} else {
					valid = {valid:true, value: hashPass(newpass)}; // we want it set to "assde232shwsww1323"
				}
			} else {
				// in get or find mode, we accept whatever the password is
				valid = true;
			}
			return(valid);
		}}
	}
}
````

So if the user sends us:

    PUT /user/123 {id:"10",name:"john",password:"poorpw"}		

then the response from the validation function will be `{valid:false,message:"password_too_short"}`, the `update()` will fail, and the error passed back to the calling controller and hence function will be "password_too_short".

On the other hand, if the user sends us a good password:

    PUT /user/123 {id:"10",name:"john",password:"longerpwisgood"}

Then the response from the validation function will be `{valid:true,value:"assde232shwsww1323"}`. The final record stored in the database will be:

    {id:"10",name:"john",password:"assde232shwsww1323"}


##### Direct Access
You can directly access the predefined validations as:

````JavaScript
var validator = require('booster').validator;
````

The validator is called with the item to validate and the validation:

````JavaScript
validator("abcd","email"); //false
validator("abcd","alphanumeric"); // true
````


#### Visibility
Sometimes, you have fields that should always be sent; other times, there are fields that should only be sent to "private" viewers (whatever that means). Other times there are fields that should only be visible on the server and never sent out.

Determining *who* has the rights to see such fields is the job of authorization; check out [cansecurity](https://github.com/deitch/cansecurity) But the model has to support some knowledge of which fields have which visibility.

By default, when you `get()` a model object using `model.get()` or `model.find()`, it sends you all of the fields. In many cases, that is just fine. But what if you want to be able to filter those fields?

booster provides just this capability using the `visible` tag in the fields. booster supports three different levels of visibility:

* public: always visible. For example, a username. The default.
* private: visible only to those who should have access (you determine that by your authorization scheme. Did I mention [cansecurity](https://github.com/deitch/cansecurity) ?) For example, a birthday.
* secret: never sent off the server. For example, a password.

Tagging a field as `public`, `private` or `secret` does two things. First, if you `filter()` it, then you can control it.

````JavaScript
user = req.booster.models.user;
user.get("10",function(err,res){
	var allPublic, publicAndPrivate, publicPrivateAndSecret;
	publicAndPrivate = user.filter(res,"private"); // show public and private fields, but not secret
	publicPrivateAndSecret = user.filter(res,"secret"); // show public, private and secret fields - same as res
	allPublic = user.filter(res,"secret"); // show only public fields
});
````

If I were going to validate a user's password, and then send their info out, I would probably do something like this:

````JavaScript
user = req.booster.models.user;
user.get("10",function(err,res){
	var allPublic, publicAndPrivate, publicPrivateAndSecret;
	publicPrivateAndSecret = user.filter(res,"secret"); // show public, private and secret fields - same as res
	if (validatePassword(publicPrivateAndSecret.password,req.param("password"))) {
		// user is now logged in
		// filter out secret information	
		publicAndPrivate = user.filter(res,"private"); // show public and private fields, but not secret
		res.send(200,publicAndPrivate);
	}
});
````

Second, the default controllers (**not** the models), filter it, unless you **explicitly** request it not to, using the query parameter `$b.csview`. Just set it to the value you want, e.g. `$b.csview=private` will show fields tagged `"private"` and those tagged `"public"` (or untagged, which is the same thing), but **not** those tagged `"secret"`. Not setting `$b.csview` (or setting it to `$b.csview=public` will show public fields only.

Sending `$b.csview=secret` will be ignored!

Controllers:
````
GET /user/:user // defaults to getting just public or untagged fields
GET /user/:user&$b.csview=private // returns private and public fields
````


Models:
````JavaScript
req.booster.models.user.get("10",function(err,res){
	// res contains all fields: private, public, secret or untagged
});
````



#### presave
Sometimes, you need to do some processing in the model before saving it to the server. For example, if you are saving a reservation for a table, you might want to check that the table actually exists and that no other reservation is in place for that table. You can easily check the existence of another reservation for that table at that time by using `unique`:

````JavaScript
module.exports = {
	fields: {
		// lots of fields here
	},
	unique: [["table","time"]] // makes sure that the combination of table and time is unique
}
````

How do we do a presave?

````JavaScript
module.exports = {
	presave: function(attrs,models,callback) {
		// do whatever processing you need here
	}
}
````

The signature of a `presave` function is: `function(attrs,models,callback)`, where:

* attrs: the model you will be saving, a simple JavaScript object
* models: an object with all of the model classes, so you can do searches on other classes. See below.
* callback: the callback you should call back (get it?) when your `presave()` is done. Classic signature of `callback(err,res)`. If `err` is anything other than `null`, `undefined` or `false`, the save will not proceed, and the errors will be passed to the callback of the original function that called `model.save()` or `model.update()`.

Using our above example with tables and reservations, you need to be able to perform a search on table before you can let the reservation go through. Not a problem. Our example skips lots of validations.

````JavaScript
module.exports = {
	fields: {id: {required:true}, table: {required:true}, user: {required:true}, time: {required:true}},
	id: "id",
	unique: [["table","time"]], // makes the combination of table and time unique
	presave: function(attrs,models,callback) {
		models.table.get(attrs.table,function(err,res) {
			if (err) {
				callback(err);
			} else if (!res || res.length !== 1){
				// we could not find one matching table, uh oh
				callback("No such table!");
			} else {
				// we had no problems, found exactly one matching table
				callback();
			}
		});
	}
}
````

#### Extend
Every model class has a few pre-defined methods (listed in detail in the next section). However, if you want additional custom methods, you can add them here. 

Why would you want them? Well, what if you want to do some unique processing, e.g. hashing passwords. You might want to be able to do:

    booster.models.user.hashPassword(pass);
		
Here is an example `user.js` model file:

````JavaScript
module.export = {
	fields: {
		"id":{required:true},
		"name":{required:true},
		"fullname":{required:true},
		"email":{required:true},
		"password":{required:true,visible:"secret"}
	},extend: {
		checkPassword: function (check,valid,callback) {
			bcrypt.compare(check,valid,function (err,res) {
				callback(res);
			});
		},
		hashPass: function (pass,callback) {
			bcrypt.genSalt(WORKFACTOR,function (err,salt) {
				bcrypt.hash(pass,salt,function (err,hash) {
					callback(hash);
				});
			});
		}
	}
};
````

In the above example, in addition to the usual `get`, `find`, `create`, etc. model functions, you can call `booster.models.user.checkPassword("abc","asasqgsqb24h2whsq",callback);` and see if "abc" hashes to "asasqgsqb24h2whsq".

#### Model Methods
No, I don't mean ways to display clothing for photography!

What methods are there on the models themselves? And when would you want to use them? Primarily, you will use them if you *define your own controller functions.* The model classes, as discussed above, provide all of the validations and unique data checking. Each model class provides several simple methods for persisting the models:

* get: retrieve one object by ID. Signature: `get(key,callback)`
* find: retrieve one or more objects by search parameters. Signature: `find(search,callback)`
* update: update replace one or more objects. Signature: `update(key,model,callback)`
* patch: update **without** replace one or more objects. Signature: `patch(key,model,callback)`
* create: create a new object. Signature: `create(model,callback)`
* destroy: destroy an object. Signature: `destroy(key,callback)`

You retrieve model classes, if you need them for controllers (but you can always rely on the default), from `req.booster.models` or your defined `booster.models`. For example, if you called `booster.resource('user')`, then the `user` class is at `req.booster.models.user` and `booster.models.user`. 

The model will call validations in the following cases:

* get: will validate the single retrieved object, if any, after getting from database
* find: will validate each and every retrieved object, if any, after finding in database
* update: will validate the object prior to sending to the database
* patch: will validate the object prior to sending to the database
* create: will validate the object prior to sending to the database

##### Callbacks
The signature of every callback is:

    callback(err,res);
		
The `err` will always be `undefined` or `null` if there is no error, and an error message if there is an error. The error message can be a String, Array, Object or anything that might be passed by the underlying database. If the error is due to something built-in, like validations or `unique` requirements, the error message will follow a very specific pattern. See below.

The `res` is the returned data. It is generally determined by your underlying `db` that you passed to `booster.init()`. However, it is expected to follow a particular pattern:

````JavaScript
// get a single item, return a single item
model.get("25",function(err,res){
	// res = {id:"25",name:"john",email:"john@smith.com"}
});

// find 0, 1 or more items, return an array
model.find({name:"john"},function(err,res){
	// res = [{id:"25",name:"john",email:"john@smith.com"},{id:"30",name:"john",email:"john2@myplace.com"}]
});

// update, create or destroy an item, return the key of the updated item
model.update("25",{name:"jim"},function(err,res){
	// res = "25"
});
model.create({name:"jim"},function(err,res){
	// res = "51"
});
model.destroy("25",function(err,res){
	// res = "25"
});

````
When validations fail, the callback will contain the error message(s). However, the object itself that failed *will still be sent in the response*. This should make it far easier to debug.

##### Errors
When a call to a model method has an error, it returns the error as follows.

* `db` errors: just passed on as is
* validation errors: see below

###### Validation Errors
The `err` fields in the callback for validation errors, depends on how many records were validated, and how many errors on each field.

In general, each record validated will return a single object if there were any validation errors. So:

* If I do a `PUT /resource/:resource`, which calls `update()` on a single record, then any validation errors will return a single object.
* If I do a `PATCH /resource/:resource`, which calls `update()` on a single record, then any validation errors will return a single object.
* If I do a `GET /resource/:resource`, which calls `get()`, which retrieves a single record, then any validation errors will return a single object.
* If I do a `POST /resource`, which calls `create()`, which creates a single record, then any validation errors will return a single object.
* If I do a `GET /resource`, which calls `find()`, which retrieves one or more records, then any validation errors will return an *array* of objects, one entry in the array for each failed validation.

And what does the validation error object look like? Simple: each key is a field that field validation; each value is the validation error. For example:

    {email:"email",id:"integer",name:"alphanumeric"}
		
In the above example, you validated a single record, it failed because the `email` field's value was not a valid email (it failed our predefined email validation), the `id` field was not a valid integer, and the name field was not a valid alphanumeric.

For another example:

    [{email:"email",id:"integer"},{name:"alphanumeric"}]

You validated at least two records, only possible with a `GET /resource`, two records failed. The first because of invalid `email` field and invalid `id` field, the second because of an invalid `name` field.

OK, so what are the possible values for the messages indicating what was wrong with a particular field?

* single pre-defined validation: if a field failed one pre-defined validation, even if multiple were possible (remember, you could put multiple validations on a field as an array, e.g. `{name:["alphanumeric","required"]}`), then the value will be the name of the pre-defined validation that failed, e.g. `{email:"email",id:"integer"}`
* multiple pre-defined validations: if a field failed multiple pre-defined validations, then the value will be an array of the names of the pre-defined validations that failed, e.g. `{email:["email","alphanumeric"]}`
* validation function: if a field fails one of your validation functions, then it depends what your function returned:
* * it returned a simple `false`, the message will be "invalid", e.g. `{password: "invalid"}`
* * it returned an object with `valid.valid = false`, and `valid.message` is `undefined` or `null`, the message will be "invalid", e.g. `{password: "invalid"}`
* * it returned an object with `valid.valid = false` and `valid.message` is defined and not `null`, the message will be the value of `valid.message`, e.g. , e.g. `{password: "some_custom_message"}`


### Just Models?
What if you, for some strange and odd reason (well, it cannot be *that* odd if we actually had demand to build it in here), you want *just* the models, but *not* the paths?

Pretty easy, just do:

    booster.model('post'); // returns booster, so you can chain
		booster.model('post').model('hole');
		
Done! You get validations, unique checking, all of the fun stuff, but no paths are created.


### Persistence
Of course, the thing you want to do most with models is **persist** them - send them to a database and retrieve them from a database.

So how do you persist? You call the correct methods on the `model` classes, which in turn call them on your `db` singleton.

#### db
The `db` database object provides the abstraction layer to support any kind of database for persisting your models. Since models are just POJSO, you can send them to the database as they are. Your database driver - that `db` object you gave to booster when you `init`ed it, is expected to provide the following functionality:

* get: retrieve one object by ID. Signature: `get(table,key,callback)`
* find: retrieve one or more objects by search parameters. Signature: `find(table,search,callback)`
* update: update replace one or more objects. Signature: `update(table,key,model,callback)`
* patch: update **without** replace one or more objects. Signature: `patch(table,key,model,callback)`
* create: create a new object. Signature: `create(table,model,callback)`
* destroy: destroy an object. Signature: `destroy(table,key,callback)`

Notice that these exactly mirror the functions provided by `model` classes. This should not be surprising. The `model` handles all of the validation around the actual data, and delegates the database functions to `db`.

Some common notes about the signatures:

* table: Every method has a `table` parameter. This is not necessarily a table name; it could be a database name or anything else. It is a unique string used for all models of this type, taken from the model config. Defaults to the name of the model type, e.g. `'post'`.
* callback: Every method has a `callback` parameter. The signature is in line with most expressjs functions: `callback(err,res)`. If there are errors, they should be passed in the `err` parameter, else it should be `false` or `null`. Data retrieved should be passed as `res` and should be one of: a JavaScript object; an array of JavaScript objects; null.

##### get
Get a single object from the database. 

    get(table,key,callback)

* table: The table for this model. See above.
* key: The unique ID of the model being retrieved.
* callback: The callback for this `get()`. `res` in the callback should be a single JavaScript object or null.

Example (couchdb):
````JavaScript
get: function(table,key,callback) {
  db.database(prefix+table).get(key,function(err,doc){
    var d1 = [], ret;
    _.each(doc||[],function(elm){
      if (elm && elm.doc !== null && elm.doc !== undefined) {
        d1.push(elm.doc);
      }
    });
    callback(err,d1.length > 0 ? d1[0] : null);
	});
}
````

Finding 0 objects is **not** considered an error. If the get was legitimate, and you managed to reach the database and do a search, but found no entry with that key, then you should `callback(null,null)`. `err` is reserved for *errors*.

##### find
Find one or more objects from the database based on search parameters.

    find(table,search,callback)

* table: The table for this model. See above.
* search: an object that describes the search.
* callback: The callback for this `find()`. `res` in the callback should be an array of JavaScript objects or null.

Example (couchdb):
````JavaScript
find: function(table,search,callback) {
	// construct the view from the search
  db.database(prefix+table).view(view,opts,function(err,doc){
    var d1 = [], ret;
    _.each(doc||[],function(elm){
      if (elm && elm.doc !== null && elm.doc !== undefined) {
        d1.push(elm.doc);
      }
    });
    callback(err,d1.length > 0 ? d1 : null);
	});
}
````

Finding 0 objects is **not** considered an error. If the get was legitimate, and you managed to reach the database and do a search, but found no entry with that key, then you should `callback(null,null)` or `callback(null,[])`. `err` is reserved for *errors*.

##### update
Update with replace (just like `HTTP PUT`) one object in the database.

    update(table,key,model,callback)

* table: The table for this model. See above.
* key: the unique key for the object you are updating
* val: the model to update, as a JavaScript object. By default, will send the entire model.
* callback: The callback for this `update()`. `res` in the callback is ignored

Example (couchdb):
````JavaScript
update: function(table,key,model,callback) {
	db.database(prefix+table).save(key,model,function(err,res){
		callback(err);
	});
}
````

Parameters to the `callback()` should follow the following rules:

1. If there were true errors: `callback(err)`
2. If the item was updated: `callback(null,key)`. Sending back the key as the data is an indication that the data was updated.
3. If the item was not found, e.g. the key does not point to a valid database record: `callback(null,null)`. Sending back *nothing* (`null` or `undefined`) in the `res` field indicates that there was nothing found.

##### patch
Update **without** replace (just like `HTTP PATCH`) one object in the database.

    patch(table,key,model,callback)

* table: The table for this model. See above.
* key: the unique key for the object you are updating
* val: the model to update, as a JavaScript object
* callback: The callback for this `update()`. `res` in the callback is ignored

Example (couchdb):
````JavaScript
patch: function(table,key,model,callback) {
	db.database(prefix+table).save(key,model,function(err,res){
		callback(err);
	});
}
````

Parameters to the `callback()` should follow the following rules:

1. If there were true errors: `callback(err)`
2. If the item was updated: `callback(null,key)`. Sending back the key as the data is an indication that the data was updated.
3. If the item was not found, e.g. the key does not point to a valid database record: `callback(null,null)`. Sending back *nothing* (`null` or `undefined`) in the `res` field indicates that there was nothing found.

##### create
Create a new object in the database.

    create: function(table,val,callback)

* table: The table for this model. See above.
* val: the model data to persist, as a JavaScript object
* callback: The callback for this `create()`. `res` should be the ID/key of the newly created object

Example (couchdb):
````JavaScript
create: function(table,val,callback) {
  // generate a UUID
  db.uuids(1,function(err,uuid){
    if (err || !uuid.length || uuid.length < 1) {
      callback(err);
    } else {
      key = uuid[0];
      db.database(prefix+table).save(key,val,function(err,res){
        callback(err,key);
      });
    }
  });
}
````


Parameters to the `callback()` should follow the following rules:

1. If there was not created due to errors: `callback(err)`
2. If the item was created: `callback(null,key)`. The newly created `key` should be sent to indicate success and create a reference.

##### destroy
Remove an object from the database.

    destroy(table,key,extra,callback)

* table: The table for this model. See above.
* key: the key of the object you are destroying
* extra: any extra data you need to perform the destroy. E.g. some doc-oriented databases also require a revision.
* callback: The callback for this `destroy()`. `res` will be ignored

Example (couchdb):
````JavaScript
destroy: function(table,key,extra,callback) {
  db.database(prefix+table).remove(key,extra,function(err,res){
    callback(err);
  });
}
````

Parameters to the `callback()` should follow the following rules:

1. If there were true errors: `callback(err)`
2. If the item was deleted: `callback(null,key)`. Sending back the key as the data is an indication that the item was removed.
3. If the item was not found, e.g. the key does not point to a valid database record: `callback(null,null)`. Sending back *nothing* (`null` or `undefined`) in the `res` field indicates that there was nothing found.





# Licensing
booster is released under the MIT License http://www.opensource.org/licenses/mit-license.php

# Author
Avi Deitcher https://github.com/deitch