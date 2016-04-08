var assert = require('assert');
var serializer = require('jonapiserializer');
var remoteapi = require('../');

var fejkhost = () => {

};
var fejkclient = () => {

};

describe('jonremoteapi', function() {
	it('should send api', () => {
		var sentdata;
		var sender = (str) => {
			sentdata = str;
		};
		var api = {
			a: function() {},
			b: function() {}
		};
		var remote = remoteapi(sender);	
		remote.init(api);
		assert.equal(sentdata, '__api_init:' + JSON.stringify(serializer.serialize(api)));
	});	
	it('should handle init api', () => {
		var localHandler = (data) => local.handle(data);
		var remote = remoteapi(localHandler);
		var local = remoteapi(remote.handle);

		var remoteApi = {
			test: function() {}
		};
		remote.init(remoteApi);
		assert.deepEqual(Object.keys(local.api), Object.keys(remoteApi));
	});
	it('should send method call', () => {
		var localHandler = (data) => local.handle(data);
		var remote = remoteapi(localHandler);
		var local = remoteapi(remote.handle);

		var testCalled = false;

		var remoteApi = {
			test: function() {
				testCalled = true;
			}
		};
		remote.init(remoteApi);
		local.api.test();
		assert.ok(testCalled);
	});
	it('should send method call nestled api', () => {
		var localHandler = (data) => local.handle(data);
		var remote = remoteapi(localHandler);
		var local = remoteapi(remote.handle);

		var testCalled = false;

		var remoteApi = {
			collection: {
				test: function() {
					testCalled = true;
				}
			}
		};
		remote.init(remoteApi);
		local.api.collection.test();
		assert.ok(testCalled);
	});

	it('should send method call in both directions', () => {
		var localHandler = (data) => local.handle(data);
		var remote = remoteapi(localHandler);
		var local = remoteapi(remote.handle);

		var echoCalled = false
				echoResponseCalled = false;

		var remoteApi = {
			echo: function() {
				echoCalled = true;
				remote.api.echoResult();
			}
		};
		var localApi = {
			echoResult: function() {
				echoResponseCalled = true;
			}
		}
		remote.init(remoteApi);
		local.init(localApi);
		local.api.echo();
		assert.ok(echoCalled);
		assert.ok(echoResponseCalled);
	});
	it('should invoke callback', () => {
		var localHandler = (data) => local.handle(data);
		var remote = remoteapi(localHandler);
		var local = remoteapi(remote.handle);

		var testCalled = false;
		var cbResult = '';

		var remoteApi = {
			test: function(cb) {
				testCalled = true;
				cb('ok');
			}
		};
		remote.init(remoteApi);
		local.api.test(result => cbResult = result);
		assert.ok(testCalled);
		assert.equal(cbResult, 'ok');
	});


	it('should throw error', () => {
		var remote = remoteapi(() => {});
		assert.throws(() => {	remote.handle('malformed');	}, /not api data/	);
	});
});
