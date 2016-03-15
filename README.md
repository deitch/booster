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

## Breaking Changes
Version 2.0.0 and higher works **only** with expressjs version 4.x. Booster versions <2.0.0 will work **only** with express version <4.0.0 and booster versions >=2.0.0 will work **only** with express version >=4.0.0.

Version 2.0.0 and higher also does not pass the status code to the post-processor. You can retrieve it yourself via `res.statusCode`. See the documentation on post-processors.

## Features
Here are just *some* of the key features:

* Standard REST verbs/actions and paths: `GET` (index), `GET` (show), `POST` (create), `PUT` (update), `PATCH` (patch), `DELETE` (destroy)
* Restrict verbs by resource
* Multiple paths to same resource
* Root path to resource
* Nested resources
* Override controller behaviour by action
* Custom names for a resource by path
* `GET` (index) can send list or object
* Custom base paths (like `/api`)
* Paths to resource properties
* Define relations between resources - 1:1, 1:N, N:1, N:N
* Automatic validation of field values for relations
* Automatic retrieval of related resources
* Pre-processing filters across all actions or by action - at the controller level and at the model level
* Post-processing filters across all actions or by action - at the controller level and at the model level
* Automatic list/update of related resources
* Built-in validations
* Custom validation functions
* Validation based on values in other resources (e.g. child cannot be set to "valid" if "parent" is not "valid")
* Default field values
* Default search filters
* Check for unique items and conflicts, and return or suppress errors
* Restrict mutability by field
* Cascading field changes to children
* Cascading delete: automatically cascade deletes to children, prevent if children exist, or prevent unless force
* Differing visibility by field: public, private, secret and custom
* Custom presave processors
* Custom model functions

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
* `embed`: whether or not to enable global embedding via HTTP API. See below.


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

If you prefer to stick with the commonly-accepted standard for plural route names, just indicate it:

    booster.resource('comment',{pluralize:true});
		
This sets up a resource named 'comment', expecting a controller (or using the default) for comment, and a model (or using the default) for comment. As shown above, it creates six paths by default:

    GET       /comments             comment#index()
    GET       /comments/:comment    comment#show()
    POST      /comments             comment#create()
    PUT       /comments/:comment    comment#update()
    PATCH     /comments/:comment    comment#patch()
    DELETE    /comments/:comment    comment#destroy()

Note that the controller name, model name and parameter are unchanged as single, and you instantiate the resource with a single element; you just tell it that the base of the route should be plural. 


#### Name of the rose. I mean resource.
The first (and only required) argument to `booster.resource()` is the name of the resource. It should be all string, valid alphanumeric, and will ignore all leading and trailing whitespace. It will also ignore anything before the last slash, so:

    abc     -> abc
		/abc    -> abc
		a/b/c   -> c
		ca/     -> INVALID

The name of the resource is expected to be single, since the resource is a `car` or `post` or `comment`, and not `cars`, `posts` or `comments`. If you want the *path* to be plural, as `/comments/:comment` and not `/comment/:comment`, then use the `pluralize` option; see below.

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

More details are available in [responses.md](./responses.md).

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

##### Pluralize
If you prefer to stick with the commonly-accepted standard for plural route names, use the `pluralize` option:

    booster.resource('comment',{pluralize:true});
		
This sets up a resource named 'comment', expecting a controller (or using the default) for comment, and a model (or using the default) for comment. As shown above, it creates six paths by default:

    GET       /comments             comment#index()
    GET       /comments/:comment    comment#show()
    POST      /comments             comment#create()
    PUT       /comments/:comment    comment#update()
    PATCH     /comments/:comment    comment#patch()
    DELETE    /comments/:comment    comment#destroy()

Note that the controller name, model name and parameter are unchanged as single, and you instantiate the resource with a single element; you just tell it that the base of the route should be plural. 


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

###### Plural Resource as a Property
If you made the child resource pluralized, you need to pluralize the resource-as-a-property as well. 

So you can do this:

````javascript
booster.resource('group'); // creates /api/group
booster.resource('user',{resource:{group:["set"]}}); // creates /api/user/123/group
````

In the above, the `group` in `/api/user/123/group` is singular (but still will return a list of group IDs).

You also can do:

````javascript
booster.resource('group',{pluralize:true}); // creates /api/groups
booster.resource('user',{pluralize:true,resource:{groups:["set"]}}); // creates /api/users/123/groups
````

... wherein the `group` in `/api/users/123/groups` is plural.

But you **cannot** do:

````javascript
booster.resource('group',{pluralize:true}); // creates /api/groups
booster.resource('user',{pluralize:true,resource:{group:["set"]}}); // creates /api/users/123/group
````

... because you pluralized `group`, so as a child resource / resource as a property, you **must** pluralize it as well.


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

### Accessing Models
As you will see below, booster makes the models (and all of their functions) available in several places by passing them into calls, like filters and post-processors.

In addition, you have an even better way to access them: `request`.

Your express request will be loaded with `req.booster`, an object which includes `req.booster.models`. These are available on any handler after `booster.init`. For example:

````JavaScript
app.use(handler1); // will NOT have req.booster
booster.init();
app.use(handler2); // will have req.booster
````

If you need to have `req.booster` available even *before* calling `booster.init()`, just add the `reqLoader` middleware:

````JavaScript
app.use(booster.reqLoader);
app.use(handler1); // will have req.booster TOO
booster.init();
app.use(handler2); // will have req.booster
````

And don't worry... you know it is safe to run multiple times (idempotent, for those who prefer fancy words).


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

#### Controller Filters
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

Before you start jumping up and saying, "hey, that is business logic, which should go in the models! [Fat models and skinny controllers!](http://www.slideshare.net/damiansromek/thin-controllers-fat-models-proper-code-structure-for-mvc)", **you are right**. But sometimes your controllers need to do filtering or post-processing that is appropriate at the controller level, hence Filters.

For filters (pre-index/show/update/create/delete) and post-processing (post-index/show/update/create/delete) at the model level, see in the section on models.

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


#### Controller Global Filters
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


#### Controller Post-Processors
A common use case is one where you want to do some post-processing *before* sending the response back to the client, for example, if you `create` with `POST /users` but before sending back that successful `201`, you want to set up some activation stuff, perhaps using [activator](http://github.com/deitch/activator). Like with filters, you *could* override a controller method, like `create`, but then you lose all of the benefits.

The solution here is post-processors, methods that are called *after* a successful controller method, but *before* sending back the `200` or `201`. Does booster support post-processors? Of course it does! (why are you not surprised?)

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
function(req,res,next,body) {
};
````

`req`, `res`, `next` are the normal arguments to a route handler. `body` is the body returned by the controller method, if any. If you want the `res` status as set until now, you can retrieve it with the standard `res.statusCode`.

Your post-processor filter has 3 options:

* Do nothing: if it does not alternate the response at all, just call `next()` as usual.
* Error: as usual, you can always call `next(error)` to invoke expressjs's error handler.
* Change the response: if it want to alternate the response, call `res.send()` or anything else. 

#### Sorting and Limiting
What if you want to sort the results of a `GET` (i.e. `index`) - ascending or descending - by a specific field like `age`, or limit the results to only, say, the first 20 results?

Turns out it is pretty easy to do... because you don't need booster to do it.

One way to do it is to `GET` the entire thing and then sort it client-side, or do it server-side in post-processors, as we just saw.

````JavaScript
r.get('/users').end(function(err,res){
	// now we have all of the users over the network
	// all users in descending order
	var users = _.sortBy(res,"age").reverse();
	// now get the first 20
	users = users.slice(0,20);
});
````

But that is a royal pain, and incredibly inefficient to boot! You had to extract all of them from the database, send them all over the wire to the client (possibly a browser), then sort and reverse them all, then take the first 20. How would you like to do that with 10MM records?

You could save part of it by filtering it in the controller using post-processors:

````JavaScript
{
	post: {
		index: function(req,res,next,body) {
			if (res.statusCode === 200 && body && body.length > 0) {
				// all users in descending order
				var users = _.sortBy(body,"age").reverse();
				// now get the first 20
				users = users.slice(0,20);
				// save it to the body
			}
		}
	}
}
````

But you still need to do a lot of extra work in the post-processor, and you are still retrieving too many records over the nearby network from the data store.

The correct way to do this is to have the database do the sorting and filtering. Most database drivers support some form of sorting by a field and limiting the count. The only question, then, is how we get the correct parameters to the database driver.

The solution is simple: **query parameters**.

As you have seen earlier, and will see again below, every query parameter *except those beginning with `$b.`* are passed to `model.find()` and hence `db.find()` as is. In order to sort and filter, all you need to do is pass those parameters to the request query.

Here is an example. Let's say your database driver supports a search parameter `sort`. If `sort` is present, it will sort the response by the field, descending if negative:

    {sort:"age"} - sort by age ascending
    {sort:"-age"} - sort by age descending

Similarly, it might support count:

    {count:20} - return the first 20 matching records

In combination, you might have 

    {sort:"age",count:20} - give me the 20 youngest
    {sort:"-age",count:20} - give me the 20 oldest

Since all of the query parameters are passed to the driver, just do:

    GET /users?sort=-age&count=20

No booster magic involved!

Aha, you will ask, but does that not tie my REST API query directly to my database driver implementation? Where is the nimbleness I would get from indirection?!

Simple: the database "driver" that you pass to booster need not be the actual MySQL or Mongo or Oracle or whatever driver. It is just an object with a few key functions. Use your own that wraps the standard driver (that is what we do) . Then you can define your own terms and use them. Voilà.












### Models
And what about all of our models? What do we do with them?

Models are just standard representations of back-end data from the database. Like controllers, models are completely optional. If you don't provide a model file, the default will be used. If you prefer to design your own, create it in *modelPath* directory, either the default or the one you provided when initializing booster.

So what is in a model? Actually, a model is an automatically generated JavaScript object handler. It is driven by a config file in which you tell it which you tell booster, for this particular model, how to manage data: name in the database, id field, validations, what should be unique, etc.

* `name`: what the name of this model should be in your database. Optional. Defaults to the name of the file, which is the name of the `resource` you created in `booster.resource('name')`.
* `fields`: what fields this model should have, and what validations exist around those fields
* `unique`: what unique fields need to exist for this model
* `uniqueerror`: whether or not to return an error for a unique conflict
* `id`: what the ID field is. We need this so that we can use "unique" comparisons and other services. Optional. Defaults to "id".
* `presave`: a function to be executed immediately prior to saving a model via update or create. Optional.
* `extend`: an object, with functions that will extend the model. Optional. See below.
* `delete`: rules for creating, preventing or enforcing cascading deletes. Optional. See below.
* `filter`: filters before performing a model action
* `post`: actions to take after the model

An actual model instance is just a plain old javascript object (POJSO). The data returned from the database to a controller should be a POJSO, as should the data sent back.

#### name
The `name` is just an identifier for this model, and is optional. It defaults to the name of the file, which is the name of the resource you created. 

It is used, however, as the value of the `table` passed to all the database calls. See below under Persistence.

#### fields
The `fields` is a list of all of the required fields and properties that are used for this model. It includes the following:

* `required`: boolean, if the field is required. Ignored for PUT updates. Default `false`
* `createblank`: boolean, if this field is optional during creation. ignored if `required === false`. Default `false`
* `mutable`: boolean, if the field can be changed by a client request. Default `true`
* `visible`: this field is one of: public (visible to all), private (visible only for explicit private viewers), secret (never sent off the server)
* `validation`: validations to which to subject this field
* `association`: how this field determines a relationship between this resource and another resource
* `type`: if this field should be a particular type. If it is, then when doing a `find()`, it will cast it to the appropriate type, if possible.
* `default`: if this field is not specified, a default value.
* `filter`: if filtering should be done on this field in the case of `index()`. It should be an object with the following properties:
   * `default`: what filter value should be applied to this field, if none is given
   * `clear`: what value if applied should indicate no filter
* `cascade`: if this field is changed, cascade the change down to dependent model items. See details below.



Example: 
````JavaScript
fields = {
	id: {required: true, createoptional: true, mutable: false, visible: "public"},
	name: {required: true, mutable:false, visible: "public", validation:["notblank","alphanumeric"]},
	email: {required: true, mutable:true, visible: "public", validation:"email"},
	time: {required:true,mutable:true,type:"integer"},
	somefield: {filter:{default:"foo",clear:"*"}}
}
````

The `required` boolean is ignored in two cases:

1. PUT update: This makes sense. You might be updating a single field, why should it reject it just because you didn't update them all? If the `name` and `email` fields are required, but you just want to update `email`, you should be able to `PUT` the follwing `{email:"mynewmail@email.com"}` without triggering any "missing field required" validation errors.
2. POST create and `createoptional === true`: If you flag a field as `required`, but also flag it as `createoptional`, then if you are creating it, validations will ignore the `required` flag. Well, that's why you set it up as `createoptional` in the first place, right?

##### default values
If you specify a `default` value for a field, then if the field is unspecified, it will be set to this value. Some important points:

* This only applies to `PUT` and `POST`. `PATCH` leaves the previous value.
* This will only apply if there is no value given at all. If it is an empty string or 0 or some other "falsy" value, it will not be applied.
* If the field is `required`, and there is a `default` value is specified, then if the `PUT` or `POST` value of the field is blank, the default value will be applied and the `required` condition will be satsified.

##### filters
The filter option can be a little confusing, so here is a better explanation.

Let's say you have defined a resource `play`. Normal behaviour would be:

* `GET /play` - list all of the `play` items
* `GET /play?somefield=foo` - list all of the `play` items where `somefield` equals "foo"

However, you want it the other way around. You want `GET /play` to return only those items where `somefield` equals "foo", unless it explicitly gives something else.

* `GET /play` - list all of the `play` items where `somefield` equals "foo"
* `GET /play?somefield=bar` - list all of the `play` items where `somefield` equals "bar"

Setting the model as above with `filter` set on `somefield` will provide exactly this outcome:

    somefield: {filter:{default:"foo"}}

But this creates a different problem. How do I tell the API, "send me all of the `play` items, whatever the value of `somefield` is"? Before adding the default filter, you would just do `GET /play`, but we added a filter to that!

The solution is to set a `clear` on the filter. Whatever the `clear` is set to, that is what, if the parameter is set, will match all. So using the setup from above:

    somefield: {filter:{default:"foo",clear:"*"}}

We get the following:

* `GET /play` - list all of the `play` items where `somefield` equals "foo"
* `GET /play?somefield=bar` - list all of the `play` items where `somefield` equals "bar"
* `GET /play?somefield=*` - list all of the `play` items

Of course, you can set the value of `clear` to anything you want: "*" (as in the above example), "any", "all", or "funny". Whatever works for you!

##### cascade

What if you have an item that has dependent items. When you make a change to a field here, you want to cascade similar changes to all of the "child" items? Here is an example. 

I have two models, `post` and `comment`. They look like this:

		post: {
			id: {required:true,createoptional:true},
			content: {required:true},
			status: {required:true,default:"draft",validation:"list:draft,published"}
		}

And the comment:

		comment: {
			id: {required:true,createoptional:true},
			post: {required:true},
			content: {required:true},
			status: {required:true,default:"draft",validation:"list:draft,published"}
		}

What you want is when you publish a `post` by changing its status from "draft" to "published", that all dependent `comment` elements are changed to `published` as well. Now, you might *not* want that, in which case, well, do nothing! But if you do...

Of course, you can do that by putting a `post` processor in the controller. For example, the controller for `post` might be:

    post: {
			patch: function(req,res,next,body) {
				if (req.body && req.body.status === "published") {
					req.booster.models.content.find({post:req.param("post")},function(err,data) {
						if (data && data.length > 0) {
							req.booster.models.content.patch(_.map(data,"id"),{status:"published"},function(err,data){
								next();
							});
						}
					});
				}
			}
		}

That would work, but requires extra work and more error-handling than I have done here. If you want 3-4 levels of cascade - publishing a `category` leads to publishing child `post` leads to publishing child `comment` leads to (you get the idea) - it gets terribly messy and long. It also means that if you make the changes somewhere *inside* your program - i.e. not through the controller, say, by modifying the model from elsewhere, you won't catch it. What a mess!

Instead, let's go the simple route! `booster` allows you to say, "if I change this field to a certain value, then all children should get the same change."

We can rewrite the model for `post` as follows:

    post: {
			id: {required:true,createoptional:true},
			content: {required:true},
			status: {required:true,default:"draft",validation:"list:draft,published", 
			    cascade: {value:"published",children:"comment"}
				}
		}

Note what we added: `cascade: {value:"published",children:"comment"}`.

This means: if we change this field's value to "published", then all instances of `comment` which have the value of `post` (since our type is `post`) equal to our `id` should have their `status` (since our field is `status`) changed to "published" as well.

Here are the parts of cascade you can set:

* `value`: setting which value should trigger a cascade. This can be a string or an array of strings. If not set, then **all** value changes trigger a cascade.
* `children`: which children who have a field named the same as our current model and a value the same as this item's `id` should be cascaded to. This can be a string or an array of strings. If `children` is not set, nothing is ever cascaded (since we have nothing to cascade it to!).


##### Ignored Fields
As stated earlier, a field that appears in the model for a `create`, `update` or `patch`, or in the data retrieved from the data store for a `get` or `find`, **must** be in the list of fields, or you will get an unknwon field error.

The exception is any field that starts with `$b.`. (Sound familiar? It should; it is the *exact same flag* we used for queries.

Any field whose name starts with `$b.` will be passed to `presave` and `filters` and `post` processors, but **not** to the validation functions or the database updates.

What could that be useful for? Well, what if you are creating a group, and business logic dictates that when a group is created, add the creator as a member.

    POST /groups {name:"My Group"}

Now, how do you add the user as a member? Well, the *second* member looks like this:

    POST /memberships {user:25}
		
But what about the logic for the first user? No problem, this is domain logic, so let's add it to the model post processors:

````JavaScript
module.exports = {
	fields: {
		name: {required:true,validation:"string"}
	},
	post: {
		create: function(model,models,err,res,callback) {
			// assuming res = ID of newly created group
			var uid = ???; // how do we get the user ID?!?!?
			models.memberships.create({group:res,user:uid},callback);
		}
	}
}
````

In theory, we could do some strange "get the context" stuff, but that really does break MVC, not to mention dependency injection. The model should not have to know about things like that! Only the controller should.

So we want the controller to inject the user into the model, so the post-processor can handle it. No problem, I will use a controller filter:

````JavaScript
module.exports = {
	filter: {
		create: function(req,res,next){
			req.body.user = req.GetMyUser(); // the controller should know how to do this
		}
	}
}
````

You know what happens next, right? The field `user` was never defined as a field on the `groups` model, because it is **not a property of the group**. Our `POST /groups {name:"My Group"}` will return a `400` with the error `{user:"unknownfield"}`.

We need some way to have the filter add the user so it gets passed to the model filters and post-processors, but **not** the validators or database saves.

Hence `$b.`*anything*. 

````JavaScript
// controller
module.exports = {
	filter: {
		create: function(req,res,next){
			req.body['$b.user'] = req.GetMyUser(); // the controller should know how to do this
			// now it will safely skip the validators, but still get passed to filters and post-processors
		}
	}
}


// model
module.exports = {
	fields: {
		name: {required:true,validation:"string"}
	},
	post: {
		create: function(model,models,err,res,callback) {
			// assuming res = ID of newly created group
			var uid = model['$b.user']; // how do we get the user ID?!?!?
			models.memberships.create({group:res,user:uid},callback);
		}
	}
}


````





#### Validations

Validation for a field is an object that defines the validations to which any creation of an object will be subject. The actual validations themselves will be in the property `valid`.

For example, if you have a field called `name`, it will look like this:

    name: {  validation:{valid:"alphanumeric"}  }

Or 

    name: {  validation:{valid:["email","alphanumeric"]}  }

Or is a function, like this:

    name: {  validation:{valid:function(){...}}  }


However, you can just simplify it as follows:

    name: {  validation: "alphanumeric"  }

Or 

    name: {  validation: ["email","alphanumeric"]  }

Or is a function, like this:

    name: {  validation: function(){...} }



Validations - in the object format as the value of `valid` or in the simplified format as the top-level property - are one of:

* Predefined validations that you can use to check the field
* An arbitrary function that you can define to validate and even manipulate the field

Each of these is explained in more detail below.

##### Predefined validations
Predefined validations are a single string or an array of strings that name validations to which to subject each model *before* sending persisting them to the database or accepting them from the database. 


The following validations exist as of this writing:

* `notblank`: Is not null, undefined or a string made up entirely of whitespace
* `notpadded`: Does not start or end with whitespace
* `email`: Is a valid email pattern. Does *not* actually check the email address. For example, `fooasao12122323_12saos@gmail.com` is a valid email pattern, but I am pretty sure that the address is not in use.
* `integer`: must be a valid javascript number. **Note:** JavaScript does not distinguish between different number types; all numbers are 64-bit floats, so neither do we.
* `number`: same as `integer`
* `float`: same as `integer`
* `double`: same as `integer`
* `alphanumeric`: must be a valid alphanumeric `a-zA-Z0-9`
* `string`: must be a string
* `boolean`: must be a boolean `true` or `false`
* `array`: must be an array
* `integerArray`: must be an array, every element of which must be a valid integer
* `stringArray`; must be an array, every element of which must be a valid alphanumeric
* `unique`: must be an array, no element of which may be repeated more than once
* `minimum:<n>`: must be a string of minimum length `n`
* `list:item,item,item,...,item`: must be one of the string items in the list

If two or more validations are provided in an array, then **all** of the validations must pass (logical AND).


###### Direct Access
You can directly access the predefined validations as:

````JavaScript
var validator = require('booster').validator;
````

The validator is called with the item to validate and the validation:

````JavaScript
validator("abcd","email"); //false
validator("abcd","alphanumeric"); // true
````


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

##### Parent Validation
In addition to the usual validations - predefined and function - you have the option to create "parent" validations. A field in one item is only allowed a certain value if the field in another related item matches it.

This is best explained with an example.

You have a model called `category` and another called `article`. Each `article` belongs to one, and just one, category (for the database-minded, N:1 relationship). In addition, both articles and categories have a field called `status`, which can be set to "published" or "draft". Well, then, your models look like this:


````JavaScript
// category
{
	fields: {
		id: {required:true},
		name: {required:true, validation:"alphanumeric"},
		status: {validation:"list:draft,published"}
	}
}

// article
{
	fields: {
		id: {required:true},
		category: {required:true}, // which category this article is part of
		name: {required:true, validation:"alphanumeric"},
		status: {validation:"list:draft,published"}
	}
}
````

You want to *ensure* that even though an article could be draft or published, do **not** let someone set an article to `"published"` unless its category is *also* already published. Makes sense right? No one can see the article, unless they already can see the category. In other words, this is a *more* restrictive validation. 

The field `status` must pass the usual validations - one of `"draft"` or `"published"` **and** it must have its category already published.

You know booster will help you do this, right? Sure you do! Just tell the `article` it cannot be published if the parent is not also:

````JavaScript
// article
{
	fields: {
		id: {required:true},
		category: {required:true}, // which category this article is part of
		name: {required:true, validation:"alphanumeric"},
		status: {validation:
			{valid:"list:draft,published",parent:"category",check:"published"}
		}
	}
}
````

The above means, "only accept as valid one of 'draft' or 'published'. Once you passed that check, get the model `category` (our 'parent'), and, if we are setting our status to 'published', check that the parent is also 'published'".

Note that we have to use the object format for `validation` here; the simplified format will not work.

The properties of the `validation` object thus are:

* `valid`: the usual validation, as described above
* `parent`: what field we need to check in ourselves, and grab an object whose ID matches that
* `check`: which values of this field we should check

The `check` property deserves a little more explanation.

* If it is not defined, the status in the child must *always* match the parent
* If it is a string, only check if the set value of this field matches the string
* If it is an array, only check if the set value matches one of the strings in the array
* If it is an object, check the set value for a key in the object, and then check the parent for the value. See the explanation beoow.

Here are some examples, assuming all are set for `status`:

* `{parent:"category",check:"published"}` - if we set `status` to "published", check the parent; any other value, do not check
* `{parent:"category",check:["published","foo"]}` - if we set `status` to "published" or "foo", check the parent; any other value do not check
* `{parent:"category"}` - check the parent for *any* value change for `status`


###### Complex Parent Validation
In parent validation, we showed how you could require the `status` of `article` should always match the `status` of the parent `category`:

````JavaScript
		status: {validation:
			{valid:"list:draft,published",parent:"category"}
		}
````

You could also set it to check only it is certain values, example "published":

````JavaScript
		status: {validation:
			{valid:"list:draft,published",parent:"category",check:"published"}
		}
````

Or, for that matter, it must match for one of a few values:

````JavaScript
		status: {validation:
			{valid:"list:draft,published",parent:"category",check:["published","limited"]}
		}
````

However, what if you don't necessarily want to restrict the `status` to an exact *match* of the parent, but rather within a limited set? For example, what if you want:

* for the `article` to be `status` "draft", the parent can be anything at all
* for the `article` to be `status` "published", the parent must be "published" or "open"
* for the `article` to be `status` "open", the parent must be "published" or "open"
* for the `article` to be `status` "closed", the parent must be "closed"

Rather than *matching* the parent's value, you want to restrict the child's value based on the parent's. In that case, instead of setting `check` as a string or array of strings, set it as an object. 

* Each key in the object is the value of the child that triggers the check
* Each value in the object is a string for the parent that is required, or an array of strings

Our example then would look like this:

````JavaScript
		status: {validation:
			{valid:"list:draft,published,open,closed,foo",parent:"category",check:{
				published:["published","open"],
				open:["published","open"],
				closed:"closed",
				foo:"*"
			}}
		}
````

* The `valid` part of `validation` limits the potential values to "draft","published","open","closed"
* The `parent` says, "check my value against the `category`"
* The `check` says:
* * If my value is "published", then the `category` status must be "published" or "open"
* * If my value is "open", then the `category` status must be "published" or "open"
* * If my value is "closed", then the `category` status must be "closed"
* * If my value is "foo", then do not check (this is the same as not putting it in)
* * If my value is anything else, then do not check. 

Pretty cool, eh?


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

#### Model object uniqueness
So you have your models, and you have defined all the validations necessary.

But now you have a new problem: 2 users are not allowed the same username. Or perhaps the same address. Or, for that matter, anything at all that defines a **unique** object. 

One way to do it is to define a filter in which you manually search and then save the item:

````JavaScript
filter: {
	create: function(req,res,next) {
		req.booster.models.user.find({name:"john"},function(err,data){
			if (data && data.length > 0) {
				res.send(409,"already have a user named john")
			} else {
				next();
			}
		});
	}
}
````

Of course, you would need to do the same for `update` and `patch`. `booster` (as you already guessed!) makes this easier for you. You can tell the model, "this field, or these fields, or this combination of fields, must be unique, and if not, refuse to create, update or patch an object." It uses the `db.find()` function, creating a `search` to check.

This section tells you how to do it by using the `unique` property of the model, for example:

````JavaScript
	fields: {
		id: {required:true,createoptional:true},
		firstname: {},
		lastname: {}
	}, unique: ["firstname","lastname"]
````

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

##### Suppressing the error
Sometimes, you want to enforce uniqueness, but **not** to return an error. 

Here is an example. You have a notification system. You send notifications to users about their account every time that a message comes in. But you don't want to have multiple notifications about this account; after all, the user *already* has a notification in queue. So 

* `models.user.create({name:"johnsmith"},callback)` should **not** create a new user, and it **should** return an error
* `models.notification.create({user:"123",account,"456"},callback)` should **not** create a new notification, but **without** returning an error

In the latter case, the logic is, "I asked for a notification to exist for the user". Either creating a new one or failing because one exists is valid and should not return an error.

How do we do that in booster? Simple:

````JavaScript
unique:[["user","account"]],
uniqueerror:false
````

If `uniqueerror` is true, or `uniqueerror` is not set, it will have the usual, default, "send an error" behaviour. But if it is set to `false` explicitly, it will *not* `create()` the new object (or `patch()` or `update()`), but also will *not* return an error. Sweet!



#### Cascading delete
OK, so you have your great setup, with some resources dependent on other resources. Using our great example of a blogging system, you have your `post` and your `comment`s. Unfortunately, your latest little blog post offended a few too many people, and you decide to delete it.

**Hold on!** 

That blog post has 10 comments on it! When you said, "delete `post` 25", did you mean:

1. delete it and leave the comments around as orphans?
2. delete it and the dependent comments too?
3. I didn't know there were dependent comments that would become orphans! Don't let delete it unless I explicitly say so!

Well, `booster` cannot possibly divine which one of these (equally legitimate) options you mean in every scenario, so... it supports them all!

By default, `booster` just sticks with option #1: if you delete a resource, like `post` whose ID is `25`, then you delete just that resource. Nothing dependent gets deleted.

However, if you want to delete all of its dependencies - a cascading delete - you just need to tell it, "for resource `post`, whenever I try to delete it, I want you to do some dependency behaviour first!"

To set up cascading delete or prevention behaviour, set your model with the `delete` field. Here is an example model for `post`:

````JavaScript
{
	fields: {
		id:{required:true}
		// whatever other fields you want
	},
	delete: {
		children:"comment",
		policy:"prevent"
	}
}
````

The `delete` property has 2 properties itself. Here are their meanings:

##### children
The `children` property is the name(s) of the children resources to be checked. In our example above, it will find all `comment` resources that have the `post` property set to the same as our ID. 

So if we have a `post` with ID of `25`, and `comment` as follows:

    {id:"30",content:"I am a comment on post 25", post:"25"}
    {id:"31",content:"I am a comment on some other post", post:"26"}

Then `delete` will check and find the `comment` with id of `30`, since its `post` (the same name as the resource we are deleting) has a value of `25`, which matches the ID of the resource we are deleting. It will ignore the `comment` with id of `31`, since its `post` has a value of `26`, but we are deleting `post` with id of `25`.

So what does it do when it finds a child? That depends on the policy.

##### policy

The `policy` determines *what* `booster` does when it finds matching children. Here are the possible values for a `policy`. Any other values are ignored:

* `prevent`: if any children are found, the `DELETE` will return a `409`. The only way to delete this resource is to delete all of its children first.
* `forcece`: if any children are found, the `DELETE` will return a `409`, just like `prevent`. However, if the query parameter `force` is set to `true`, i.e. `?force=true`, it will delete the resource and leave the children alone.
* `cascade`: if any children are found, the `DELETE` will delete all of the children as well, and onwards to further descendents based on their policies.
* `allow`: Do not bother checking the children, just delete the resource. This is the same as having no `delete` property.


#### Model Associations or Relationships

Often (actually, in just about every real application we have ever seen), resources (or models) relate one to another.

For example, if you have a blog with categories, posts and comments, then you have something like this:

* Each category has_many posts
* Each post belongs_to one category
* Each post has_many comments
* Each comment belongs_to one post

What does all of this mean? Well, you will want a few features:

1. Validation: When I save a comment with a particular value for a field, e.g. `post=1`, I want to know that the post `1` actually exists and is a valid post.
2. Retrieval: When I retrieve an article, e.g. `GET /posts/1`, I might want to be able to say, "get me `post` 1 along with all of its comments embedded". The result would be `{name:"A Post",id:"1",Text:"Lorem ipsum",comments:[{id:"1",commenter:"John",text:"A comment",post:"1"},{id:"2",commenter:"Jill",text:"Another comment",post:"1"}]}`
3. Reverse retrieval: Conversely, if I get just a comment, e.g. `GET /comments/1`, I might want to retrieve the article with it. The result would be `{id:"1",commenter:"John",text:"A comment",post:{name:"A Post",id:"1",Text:"Lorem ipsum"}}`
4. Controlled embedding: Whether retrieving comments with the post, or post with the comments, I would want to be able to control when it embeds the related item, and when it does not.

Booster provides a simple way for you to do all of these. For it to work, there are three steps, *three being the number to which you shall count*:

1. Define the relationships on both sides, i.e. in both models. 
2. Indicate that you wish to embed in the model calls, if you are calling them directly
3. Indicate that you wish to embed in the HTTP API call, if you are calling from the Web

##### Define the Relationship

First, you need to define the relationship between the models. You do so by using the `association` flag on the field that connects one to the other. We borrowed some of the language of Rails to define relationships, since lots of people like them and are productive with them.

Continuing our example above of `category` and a `post`:

````JavaScript
// category
{
	fields: {
		posts: {association:{model:"post",type:"has_many"}}
	}
}

// post
{
	fields: {
		category: {association:{model:"category",type:"belongs_to"}}
	}
}
````

The above means

* `category` is connected to posts with the `category.posts` field
* `post` is connected to `category` with the `post.category` field

You **always** need to define the relationship on both sides, but the fields are not necessarily *marked* on both sides. In the above example, only `post` will have an actual field defined in the database `category`, which stores the ID of the `category` to which it is connected. `category` does not have any such field; `posts` is used only to retrieve related items.

Since the relationships is defined on the *field*, you can, of course, have as many relationships as you want, including self-referencing relationships (where a `post` refers to another `post`)

There are four relationship or association types:

* `has_one`: This resource has a 1:1 with another resource. This field is **not** stored in the database.
* `has_many`: This resource has a 1:N with another resource. This field is **not** stored in the database.
* `belongs_to`: This resource has a 1:1 with another resource. This field **is** stored in the database.
* `many_to_many`: This resource has an N:N with another resource. This field is **not** stored in the database.

The combinations possible are:

* 1:1: One side has `has_one`, the other side has `belongs_to`. The relationship is stored on the `belongs_to` side.
* 1:N: One side has `has_many`, the other side has `belongs_to`. The relationship is stored on the `has_to` side.
* N:N: Both sides have `many_to_many`. Neither side stores the relationship. Instead, a "join table" stores the relationship.

###### Fields of association
What are the possible property of the `association` object?

* `model`: What resource is the other side of this relationship? Put in other terms, what does this point to? In our above example, on the `post` model, the value of `category` is the ID of an instance of the resource `category`. If the name of the related resource and field are identical, you can leave out the `model` property.
* `type`: What type of relationship is this? One of `has_one`, `has_many`, `belongs_to`, `many_to_many`.
* `through`: What is the join resource for a many-to-many relationship? It must be a normal resource, defined either via `booster.resource()` or `booster.model()`

Note that when retrieving a model with a field whose association is `belongs_to`, it will **always** return a value, since it stores it in the database. When retrieving a model with a field whose association is anything else, it will not necessarily return a value, since it is only an indicator of relationship.

##### Request an embedding from the model

When you get a resource that has a relationship, it normally just returns the plain resource. To use our above example

````JavaScript
models.post.get('125',function(err,data){
	// will return
	// {title:"My Post",text:"Lorem Ipsum",category:"25"}
});
````

Note that it returned the data exactly as it appears in the database, category is set to `"25"`. However, if you want it to actually retrieve the `category` item and embed it in the returned value, you can request it:

````JavaScript
models.post.get('125',{"$b.embed":"category"},function(err,data){
	// will return
	// {title:"My Post",text:"Lorem Ipsum",category:{id:"25",name:"Important Category"}}
});
````

By inserting `{embed:"category"}`, you are telling the model's `.get()` function, "if field `category` is a relationship, retrieve its items and embed them."

You can do it the other way as well:

````JavaScript
models.category.get('25',{"$b.embed":"posts"},function(err,data){
	// will return
	// {id:"25",name:"Important Category",posts:[{id:"125",title:"First Post"},{id:"126",title:"Different Post"}]}
});
````

You also can request a deeper embed. Let's look at our category-post-comment structure again. Each category has many posts. Each post has many comments. We can retrieve the category with the posts (we just did that above), and in turn retrieve all of the comments for each post:

````JavaScript
models.category.get('25',{"$b.embed":["posts","posts.comments"]},function(err,data){
	// will return
	// {id:"25",name:"Important Category",posts:[
		{id:"125",title:"First Post",comments:[{id:"201",content:"Snarky comment"},{id:"202",content:"Praising comment"}]},
		{id:"126",title:"Different Post",comments:[]}
	]}
});
````

The `embed` property can be an array or a comma-separated string. Both of the following are equivalent:

* `{"$b.embed":["posts","foo"]}`
* `{"$b.embed":"posts,foo"}`


You can use a parameter object with the `embed` property in every model call that returns data: `get`, `find`, `patch`, `update`. because `create` and `destroy` do not return objects - `create` returns the ID, while `destroy` does not return anything - it has no meaning there.

##### Request an embedding from the http API

Of course, you are not always dealing in the guts of controllers and models! The whole **purpose** of booster is to simplify your creation of REST APIs. How do you request an embedding from HTTP? 

Put in other terms, how do you change the response of `GET /category/25` from:

````JavaScript
// simple data
{id:"25",name:"Important Category"}
````

into:

````JavaScript
// related posts embedded?
{id:"25",name:"Important Category",posts:[{id:"125",title:"First Post"},{id:"126",title:"Different Post"}]}
````

Simple! Just enable HTTP embedding (see the next section), and add the embed as the query parameter `$b.embed`:

````JavaScript
// GET /category/25?$b.embed=posts
{id:"25",name:"Important Category",posts:[{id:"125",title:"First Post"},{id:"126",title:"Different Post"}]}
````

The rules for the value of `$b.embed` in the controller are identical to those for using the `$b.embed` parameter in the `model.get()` request.

Pretty neat, huh?

##### But think about security!

One minor little caveat. If we allow any `$b.embed` from anywhere via the HTTP API, well then someone could get something they shouldn't.

For example, let's say you have `group` and `account`. Anyone can do `GET /groups/123`, but only admins can do `GET /groups/123/account`! So far so good. But what if someone did `GET /groups/123?$b.embed=account`. Oops. Someone with access to `GET /groups/123` (which is everyone) now has the ability to work around your security wall and do the equivalent of `GET /groups/123/account`!

To prevent this scenario, you *must* enable HTTP API embedding for it to work. You *always* can do embedding from the model:

````JavaScript
models.groups.get('123',{'$b.embed':'account'},callback);
````

But via the HTTP API **requires** enabling or it just doesn't work.

How do you enable it? At one of several levels. Details below.

1. Global: You can configure booster globally, so all `$b.embed` will work. This is wide open, but you may be OK with that.
2. Resource: You can configure embedding on each resource, determining if it should allow all embedding when requested.
3. Fields: You can enable a particular field to be embedded. 

The most permissive will always work. By default, nothing is enabled. If you enable globally, no per-controller configurations matter. If you enable all embedding of controller fields, then no embedding of self matters.

###### Global
To enable all embedding globally, you just need to indicate it when you call `booster.init()`.

    booster.init({embed:true});

Do that, and all HTTP embeds will work.

###### Resource

You can indicate on a resource that you wish to allow all embeds on it. This means that if I enable embedding on a resource, say `groups`, then any request to `groups` will allow any embedding on it. 

You enable all embedding on a resource by adding a property to the configuration declaration:

    booster.resource('group',{embed:true})
		
The above means, "let anything be embedded". So I can do `GET /groups/123?$b.embed=foo,bar,members` and all would embed (if those fields exist, of course).

The `embed` parameter has several optional values:

* `true`: embed everything, as in the above example.
* array: if an array, then allow to request embedding those fields. For example, `embed:['foo','bar']` means, "allow them to embed foo and bar"


#### Model Filters
Just like with controllers, you can insert filters at the model level. Actually, most of the time that is the better place to put it. Here is why.

Let's say, for example, you want to filter out that any request to create an object via `POST /users` that has field `age` set to `18` or higher to set the field `adult` to `true`. That won't easily fit with any of the uniqueness or validation constraints above. You have 2 choices:

* controller filter on `create`
* model filter on `create`

If you do it on the controller, then `POST /users {age=25}` will work just fine, every time. But what if you create a user from somewhere else in the system? Maybe an API or as the result of some other call? In some other controller or model you do:

    req.booster.models.user.create({age:25});

Oops. Since you put the filtering logic on the *controller*, it will not be called, and your `adult` field will remain unset.

This is the very reason *why* people advocate putting business logic at a higher level than the controller. Hence model filters.


If you want an individual filter to run on a specific routing, e.g. `user.update()` or `user.show()`, you do the following:

````JavaScript
module.exports = {
	fields: {
		// my fields
	},
	filter: {
		show: function(key,next) {
			// do your filtering here
			// succeeded?
			next();
			// failed?
			next(err);
		}
	}
};
````

The options for filters are:

* `get`
* `find`
* `create`
* `update`
* `patch`
* `destroy`



##### Filter signature
The filter functions have the following signatures.

* `get`: `function(key,models,callback)`
* `find`: `function(search,models,callback)`, where `search` is a searchjs search term
* `create`: `function(model,models,callback)` where `model` is the JavaScript object that will be saved
* `update`: `function(key,model,models,callback)` where `key` is the unique ID of the item to be saved, and `model` is the new JavaScript object to replace the existing one
* `patch`: `function(key,model,models,callback)` where `key` is the unique ID of the item to be saved, and `model` is the a JavaScript object with the properties to override in the existing one
* `destroy`: `function(key,models,allback)` where `key` is the unique ID of the item to be destroyed

When you are done, just call `callback()`. If you do not want it to proceed, call the `callback(err)`, where `err` is the error we want to return. In most cases, the controller will just return a `400` with the error as the body of the response.

All of the filters have an argument with `models`, which gives direct access to all of the pre-defined models. This gives you the option to create, destroy, get or otherwise affect other models.

For example, let's say we only want to allow users over 18 and under 50. We could use validations or custom validations for this, but let's say we want to do it in a filter.

````JavaScript
module.exports = {
	fields: {
		// my fields here
	},
	filter: {
		create: function(model,models,callback) {
			if (!model || !model.age || model.age < 18 || model.age > 50) {
				callback("only users between 18 and 50!");
			} else {
				callback();
			}
		}
	}
}
````

##### Filter example

You are writing a system for managing a restaurant's reservations. When you save a reservation for a table, you want to check that the table actually exists and that no other reservation is in place for that table. You can easily check the existence of another reservation for that table at that time by using `unique`:

````JavaScript
module.exports = {
	fields: {
		// lots of fields here
	},
	unique: [["table","time"]] // makes sure that the combination of table and time is unique
}
````

Using our above example with tables and reservations, you need to be able to perform a search on table before you can let the reservation go through. Not a problem. Our example skips lots of validations.

````JavaScript
module.exports = {
	fields: {id: {required:true}, table: {required:true}, user: {required:true}, time: {required:true}},
	id: "id",
	unique: [["table","time"]], // makes the combination of table and time unique
	filter: {
		create: function(model,models,callback) {
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
}
````

##### Replace DELETE

In some models, you want to be able to call DELETE, e.g. `DELETE /users/123`, but not have it actually be deleted. A classic case is, well, users. Because so much depends upon it, you prefer to have the user `123` marked as deleted or archived somehow, but not actually have the underlying resource be destroyed.

Filters give this to you as well! All you need is the `destroy` filter with a little twist.

Since the last thing called before the actual `db.destroy()` is the filter `destroy()`, the obvious step is to create a filter that returns an error:

````JavaScript
filter: {
	destroy: function(key,models,cb) {
		models.users.patch(key,{cancelled:true},function(err,res) {
			cb("NOT DELETED! HAHA!");
		});
	}
}
````

This actually *will* work pretty well, with one minor problem. Because your filter called an error `"NOT DELETED! HAHA!"` (really, I recommend slightly less in-your-face error messages), it will return a `400` rather than a `204`. After all, it looks like an error, doesn't it? 

In order to avoid this problem, but still not have it process the actual `db.destroy()`, you simply need to flag the model as "nodelete". This will cause the filter and post-processors and everything else to run, but not the actual delete.

````JavaScript
fields: {
	name: {},
	email: {} // etc. etc.
},
delete: {prevent:true},
filter: {
	destroy: function(key,models,cb) {
		models.users.patch(key,{cancelled:true},cb);
	}
}
````

Note that this is the same `delete` property that we used for cascading delete, except that now you can also use it to prevent deleting itself!


#### presave
presave is a form of filter that is mostly deprecated now. It works, but should be replaced by filters (as we just did in the section above). Presave is the equivalent of a filter applied to `update`,`create` and `patch`.



#### Model Post-Processors
A common use case is one where you want to do some post-processing *before* sending the response back to the controller. For example, if you `create` with `POST /users` but before sending back that successful `201`, you want to set up some activation stuff, perhaps using [activator](http://github.com/deitch/activator). 

This was the example we used before, with controller post-processors. But here we want to be smart and ensure that it *always* gets called, *whenever* a user is created.

The solution here is post-processors, methods that are called *after* a model method, but *before* handing the response back to the controller. 

Like filters, post-processors are added as properties of the model object.

````JavaScript
module.exports = {
	fields: {
		// my fields
	},
	filter: {
		update: function(key,model,models,callback) {...}
	},
	// use "post" to indicate post-processors
	post: {
		create: function(model,models,callback) {}, // "create" will be called after each "create"
	}
};
````

Post-processor signatures are nearly identical to the signatures of the filters:

* `get`: `function(key,models,err,result,callback)`
* `find`: `function(search,models,err,result,callback)`, where `search` is a searchjs search term
* `create`: `function(model,models,err,result,callback)` where `model` is the JavaScript object that was saved
* `update`: `function(key,model,models,err,result,callback)` where `key` is the unique ID of the item that was saved, and `model` is the new JavaScript object that replaced the existing one
* `patch`: `function(key,model,models,result,callback)` where `key` is the unique ID of the item that was saved, and `model` is the a JavaScript object with the properties that overrode in the existing one
* `destroy`: `function(key,models,result,callback)` where `key` is the unique ID of the item that was destroyed

Notice that they add two fields: 

* `err`, which returns the error of the model action such as `save`, `find`, etc. If there was no error, it should be `null` or `undefined`.
* `result`, which is the result of the model action such as `save`, `find`, etc.


Your post-processor filter has 3 options:

* Do nothing: if it does not alternate the response at all, just call `callback()` as usual.
* Error: as usual, you can always call `callback(error)` to invoke indicate an error.
* Change the response: if it want to alternate the response, modify the `result`, and then call `callback()` or `callback(err)`.

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

Of course, a much cleaner method probably would be to have a separate file in another directory, `require()` it and call it in my controller or wherever else I need it:

````JavaScript
var passlib = require('../lib/passlib');


// this is much messier
module.exports = {
	filter: {
		all: function(req,res,next) {
			// this is much cleaner
			passlib.hashPass(req.body.password,function(){
			});

			// this is much messier
			req.booster.models.user.hashPass(req.body.password,function(){
			});
		}
	}
}
````


#### Model Methods
No, I don't mean ways to display clothing for photography!

What methods are there on the models themselves? And when would you want to use them? Primarily, you will use them if you *define your own controller functions.* The model classes, as discussed above, provide all of the validations and unique data checking. Each model class provides several simple methods for persisting the models:

* get: retrieve one object by ID. Signature: `get(key,callback)`
* find: retrieve one or more objects by search parameters. Signature: `find(search,callback)`
* update: update replace one or more objects. Signature: `update(key,model,callback)`
* patch: update **without** replace one or more objects. Signature: `patch(key,model,callback)`
* create: create a new object. Signature: `create(model,callback)`
* destroy: destroy an object. Signature: `destroy(key,parent,force,callback)`

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
