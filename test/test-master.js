/*global debugger,v8debug,before,after */
/*jslint debug:true, node:true */

// call the debugger in case we are in debug mode
before(function (done) {
	if (typeof(v8debug) !== undefined) {
		debugger;
	}
	done();
});
