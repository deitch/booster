#booster responses


##Overview
Booster is the ***fastest*** way to get a full-fledged REST service up and running in [nodejs](http://nodejs.org)!

This document provides an overview of response messages, error codes and error messages you can expect to receive from a booster app using the REST API.


|Verb|Success HTTP Code|Success Body|Failure Code|Failure Body|
|----|-----------------|------------|------------|------------|
|`GET` index|200|Array of objects|400,404|Error Message or blank|
|`GET` show|200|Object or array of objects|400,404|Error Message or blank|
|`POST`|201|ID of created object|400,404|Error message or blank|
|`PUT`|200|ID of updated object *OR* updated object|400,404|Error message or blank|
|`PATCH`|200|ID of updated object *OR* updated object)|400,404|Error message or blank|
|`DELETE`|204||400,404|Error message or blank|



## External Overrides
Two key factors can change or override the error messages. 

* Flexibility: Booster is a *very* flexible system, and can be overridden at various stages.
* Middleware: Booster is expressjs middleware, and has its position in express order of execution.

### Middleware
Any middleware executed by expressjs *prior* to booster, like authenticaton and authorization (did I mention [cansecurity](https://github.com/deitch.cansecurity)?), may return other error codes *before* booster even begins to look at the request.

### Overrides

Booster is *very* flexible and can be overridden at any stage: 

* controllers
* models
* database
* hooks
* filters
* pre-processors
* post-processors

Every one of these has an option to declare and return an error. If your app overrides any one of them, you will get custom response codes.

#### Database
Booster relies on your database driver, as described in the documentation. When it makes a call, like `db.create()` or `db.find()`, any errors are passed as is. In the case of any error:

* The http response code will be `400`
* The http response body will be whatever your database driver passed back

#### Presave
If your model has a `presave` function defined, and it returns any kind of error, any errors are passed as id. In the case of an error:

* The http response code will be `400`
* The http response body will be whatever your `presave` function passed back


## Requests and Responses
This section details each request type and expected responses.

### Index
Index means `GET` for a collection. Normally this would look like:

    GET /users
		GET /users/200/groups
		GET /groups

#### Success
`GET` for a valid collection that has no errors *always* will return `200` and an array. If there are no objects to be found, it will return an empty array with a `200`.

The only time `GET` for a collection will return `404` is if the collection is not found. Thus, if there is no resource `funny`, and you do `GET /funny`, then you will get a `404`.

The content of the response will be the array of objects.

#### Errors

##### No objects
No objects found for a valid path will return `200` with an empty array `[]`.

##### No path
An invalid path will return `404` with the body undefined.

##### Validation
If the path is valid, and objects were found by the database, but the objects fail validation, then the request will return `400` with the body as the passed through validation errors. See the section on validation errors.

##### Overrides
Any override errors will return `400` and have the body passed through as described above.


### Show
Show means `GET` for a specific resource. Normally this would look like:

    GET /users/1
		GET /groups/20


#### Success
`GET` for a valid resource that exists will return `200` and the object. If the path is invalid or the object cannot be found, it will return `404`.

The content of the response will be the single object.

#### Errors

##### No object
If the specified resource cannot be found, it will return `404` with the body defined. Thus `GET /users/100` will return `404` if no user with ID `100` cannot be found.

##### No path
An invalid path will return `404` with the body undefined.

##### Validation
If the path is valid, and an object was found by the database, but the object fails validation, then the request will return `400` with the body as the validation errors. See the section on validation errors.

##### Overrides
Any override errors will return `400` and have the body passed through as described above.


### Create
Create means `POST` to a specific resource collection. Normally this would look like:

    POST /users
		POST /groups


#### Success
`POST` for a valid collection with no errors in creation will return `201`. 

The body of the response will be text with the key of the newly created object.

#### Errors

##### No path
An invalid path will return `404` with the body undefined.

##### Validation
If the path is valid, but the body of the `POST` fails validation, then the request will return `400` with the body as the validation errors. See the section on validation errors.

##### Overrides
Any override errors will return `400` and have the body passed through as described above.

##### Unique
If the path is valid, the body of the `POST` passes validation, but the new object fails uniqueness constraints defined in the model, then the response code will be `409` with the body as the uniqueness errors. See the section on uniqueness errors.

### Update
Update means `PUT` to a specific resource, replacing it completely. Normally this would look like:

    PUT /users/25
		PUT /groups/3


#### Success
`PUT` for a valid resource with no errors in creation will return `200`. 

The body of the response will be one of:

* If `sendObject` was defined as `true`, then return the newly updated object
* If `sendObject` was defined as `false`, then return the ID of the updated object

See the section "GET after PUT/PATCH" in the documentation.

#### Errors

##### No resource
If the defined resource is not found, it will return `404` with the body undefined.

##### No path
An invalid path will return `404` with the body undefined.

##### Validation
If the path is valid, but the body of the `PUT` fails validation, then the request will return `400` with the body as the validation errors. See the section on validation errors.

##### Overrides
Any override errors will return `400` and have the body passed through as described above.

##### Unique
If the path is valid, the body of the `PUT` passes validation, but the updated object fails uniqueness constraints defined in the model, then the response code will be `409` with the body as the uniqueness errors. See the section on uniqueness errors.


### Patch
Patch means `PATCH` to a specific resource, replacing only those elements in the body of the `PATCH`. Normally this would look like:

    PATCH /users/25
		PATCH /groups/3


#### Success
`PATCH` for a valid resource with no errors in creation will return `200`. 

The body of the response will be one of:

* If `sendObject` was defined as `true`, then return the newly updated object
* If `sendObject` was defined as `false`, then return the ID of the updated object

See the section "GET after PUT/PATCH" in the documentation.

#### Errors

##### No resource
If the defined resource is not found, it will return `404` with the body undefined.

##### No path
An invalid path will return `404` with the body undefined.

##### Validation
If the path is valid, but the updated fields in the body of the `PATCH`fails validation, then the request will return `400` with the response body as the validation errors. See the section on validation errors.

##### Overrides
Any override errors will return `400` and have the body passed through as described above.

##### Unique
If the path is valid, the fields in the body of the `PATCH` pass validation, but the patched object fails uniqueness constraints defined in the model, then the response code will be `409` with the body as the uniqueness errors. See the section on uniqueness errors.


### Destroy
Destroy means `DELETE` to a specific resource, removing it completely. Normally this would look like:

    DELETE /users/25
		DELETE /groups/3


#### Success
`DELETE` for a valid resource with no errors in creation will return `204`. 

The body of the response will be empty.

#### Errors

##### No resource
If the defined resource is not found, it will return `404` with the body undefined.

##### No path
An invalid path will return `404` with the body undefined.

##### Overrides
Any override errors will return `400` and have the body passed through as described above.

##### Delete policies
If the `DELETE` fails because it violates a constraint defined by deletion policies, it will return `409`. The body of the response will be an object `{delete:"children"}`, indicating that we cannot delete because we have dependent children.


## Validation Errors
If there are validation errors at any time, for any type of request, it will always return a `400` error. The body of the error will be an object, with a series of keys and values.

* Keys: The keys of the object are the names of the fields that failed validation. 
* Values: The values of the object are the validations that failed.


The values, i.e. the names of the failures, can be one of several items.

#### Standard validations

If the validation failed was a standard built-in validation, then the message is simply the validation, i.e. the value of the `validation` (if simplified validation format) or `validation.valid` (if object validation format) field.

For example, if your model requires field `name` to be "alphanumeric" and `email` to be "email":

````JavaScript
{
	fields: {
		name: {validation:"alphanumeric"},
		email: {validation:"email"}
	}
}
````

but you pass in values that fail that, e.g

    PUT /users/25 {name:"56 !! Invalid!", email:"foo"}

Then the response will be `400`, with a body as follows:

    {name:"alphanumeric", email:"email"}

#### Required
If a field is defined as required, but not provided during `PUT` or `POST`, then the value of the field will be "required":

````JavaScript
{
	fields: {
		name: {required:true},
		email: {}
	}
}
````

but you pass in values that are missing a required field:

    POST /users/25 {email:"john@smith.com"}

Then the response will be `400`, with a body as follows:

    {name:"required"}

#### Immutable
If you try to change a field that is defined as immutable, then the value of the field will be "immutable".

````JavaScript
{
	fields: {
		id: {required:true, mutable:false}
		name: {validation:"alphanumeric"}
		email: {validation:"email"}
	}
}
````

but you pass in values that fail that, e.g

    PATCH /users/25 {id:"100"}

Then the response will be `400`, with a body as follows:

    {id:"immutable"}


#### Validation function

If you provided a validation function, instead of using one of the built-in validations, and the validation fails, then the response will be `400`, and the value will be one of the following:

* If your function provided a `message`, then the value will be the `message`
* If your function did not provide a `message`, then the value will be "invalid"

#### Parent validation
If the field has a parent validation defined on it, and the value cannot be set because it violates the parent validation constraint, then the value will be "invalidparent".

````JavaScript
{
	fields: {
		category: {},
		status: {validation:
			{valid:"set:draft,published",parent:"category",check:"published"}
		}
	}
}
````

but you pass in values that fail that, e.g

    PUT /articles/87 {status:"published"}
		
While the parent category item is still in "draft", then the response will be `400`, with a body as follows:

    {status:"invalidparent"}


## Uniqueness

If your create/update/patch passed all other validations - built-in, required, immutable, validation functions, parent validation, etc. - but violates a uniqueness constraint, then the response will be a `409` (which is the standard REST response for conflicts). 

The body will be an object as follows:

* Keys: The keys are the names of the fields whose uniqueness constraint has been violated.
* Values: The values will be "notunique"

In the case of a multiple field uniqueness constraint, for example where it is a combination of two fields that makes for a constraint, then the key will be the names of the two fields, in alphabetical order, combined with a ':'.

Some examples are helpful here:

* `{name:"notunique"}` - the value of the name field was not unique
* `{name:"notunique",email:"notunique"}` - the name and the email *each* was not unique
* `{"email:name":"notunique"}` - the combination of name *and* email together was not unique. Note the alphabetical order.

In case you are curious, yes, we figure "name+email" would make a lot more sense than "name:email". But splitting them apart to figure out which ones they are is a lot easier to do with a `:` than a `+`. In most regular expressions, `:` is just another characters, but `+` means something special.

