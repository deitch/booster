#booster example

This is a very basic booster example. If you want to see every capability, read the main `README.md`, or look at the examples in `/test`.

To start the example, just run `node ./server.js`

Then you can use your preferred http client - curl, wget, whatever makes you happy - to connect to the URL given. No authentication is required.


## defined REST paths
The example defines a single REST path, `/post`, with a single nested one `/post/:post/comment`.

All paths are open, you can do any of:

     GET       /post                           
     GET       /post/:post                     
     POST      /post                           
     PUT       /post/:post                     
     PATCH     /post/:post                     
     DELETE    /post/:post                     
     GET       /post/:post/comment             
     GET       /post/:post/comment/:comment    
     POST      /post/:post/comment             
     PUT       /post/:post/comment/:comment    
     PATCH     /post/:post/comment/:comment    
     DELETE    /post/:post/comment/:comment    

The example comes with a few posts and comments pre-defined. Look at the file `./db.js` to see the basic data available. Of course, you can use the REST API to add, change or modify.

Stopping the program and restarting with `node ./server.js` will reset the data.


## Format of the objects
All `POST` and `PUT` and `PATCH` expect JSON,and all `GET` send JSON.

### post
A post looks like: 

`{id:1,title:"A new title",content:"Lots of interesting content", other:"Some other data"}`

### comment
A comment looks like:

`{id:1,comment:"This is my comment on your post",post:1}`

Except that if you run it in orm2 mode, the relational field is a little different (see below):

`{id:1,comment:"This is my comment on your post",post_id:1}`


## Using a relational database and orm2
If you prefer to use a relational database for the data, a version of the example uses [orm2](https://github.com/dresende/node-orm2) to store the data.

In order to use orm2, there are a few steps you need to take.

1. `npm install orm` - orm is not necessary for running or developing booster, so it is not installed by default
2. `npm install <database driver>`
3. Configure `./orm2-settings.js` to have the correct database type, username and password
4. Start your database server (mysql, postgresql, or anything else supported by orm2)
5. Make sure your database server has the correct database, user, password and privileges from `./orm2-settings.js`
6. create a new database called `boosterexample` (or whatever you put in `./orm-settings.js`)
7. Start the program with the orm2 option: `node ./server.js orm2`

One other slight change. orm2 does **not** like it when the actual name of a relational field is the same as the name of the table it points to. This makes doing the following impossible:

`POST /post/1/comment {comment:"abc",post:1}`

Since the *table* comment relates to is called "post", and the linking (relational) *field* inside comment os called "post", it all goes haywire inside orm2.

So, if you are running this example in orm2 mode, be sure to use the following syntax:

`POST /post/1/comment {comment:"abc",post_id:1}`




