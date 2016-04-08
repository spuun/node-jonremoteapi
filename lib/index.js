'use strict';
const serializer = require('jonapiserializer');

const is = {
	function: obj => typeof obj == 'function',
}
const Commands = {
	INIT: 'init',
	INVOKE: 'invoke',
	INVOKE_WITH_CALLBACK: 'invoke_with_callback',
	INVOKE_CALLBACK: 'invoke_callback',
};

const apiCommandArgsSeparator = ':';
const apiToken = '__api_';
const apiTokenExpr = new RegExp('^'+apiToken);
const isApiData = data => apiTokenExpr.test(data);
const splitInTwo = (data, separator) => {
	const separatorIndex = data.indexOf(separator);
	return [
		data.substring(0, separatorIndex),
		data.substring(separatorIndex+1)
	];
}
const createApiData = (command, data) => {
	data = JSON.stringify(data);
	return `${apiToken}${command}${apiCommandArgsSeparator}${data}`;	
};
const parseApiData = data => {
	data = data.replace(apiTokenExpr,'');
	const parts = splitInTwo(data, apiCommandArgsSeparator);
	return {
		command: parts[0], 
		data: JSON.parse(parts[1])
	};
}
const callbacks = (() => {
	let callbacks = {};
	let callbackCounter = 0;

	const add = cb => {
	 ++callbackCounter;
	 var identifier = `callback_${callbackCounter}`;
	 callbacks[identifier] = cb;
	 return identifier;
	};
	
	const get = identifier => {
		var cb = callbacks[identifier];
		delete callbacks[identifier];
		return cb;
	};

	return {
		add, get: get
	};
})();
const createMethodData = (method, args) => {
	args = JSON.stringify(args);
	return `${method}:${args}`;
}
const parseMethodData = (data) => {
	let parts = splitInTwo(data, ':');
	return {
		method: parts[0],
		args: JSON.parse(parts[1])
	};
};
const remoteapi = (send) => {
	let localApi = {};
	let api = {};
	// Called when local side calls remote api method
	const invokeRemoteApiMethod = (method, args) => {
		let command = Commands.INVOKE;
		if (is.function(args[args.length-1])) {
			args[args.length-1] = callbacks.add(args[args.length-1]);
			command = Commands.INVOKE_WITH_CALLBACK;
		}
		send(createApiData(command,createMethodData(method, args)));
	};
	// Called when callback is invoked by local api
	const invokeRemoteApiCallback = (callbackId, args) => {
		send(createApiData(Commands.INVOKE_CALLBACK,createMethodData(callbackId, args)));
	};
	// Called when a method should be invoked local
	const invokeLocalApiMethod = (methodData) => {
		let methodParts = methodData.method.split('.');	
		let method = localApi;
		for (let i=0;i<methodParts.length;++i) {
			method = method[methodParts[i]];
		}
		method(...methodData.args);
	};
	// A callback in our local API has been invoked. Pass to remote side.
	const invokeLocalApiMethodWithCallback = (methodData) => {
		let callbackId = methodData.args[methodData.args.length-1];
		methodData.args[methodData.args.length-1] = function() {
			let args = [];
			for (let i=0; i<arguments.length; ++i) {
				args[i] = arguments[i];
			}
			invokeRemoteApiCallback(callbackId, args);
		};
		invokeLocalApiMethod(methodData);
	};
	// Remote api method with callback called. Handle when callback is invoked by remote side:
	const invokeLocalCallback = (methodData) => {
		let callback = callbacks.get(methodData.method);
		callback(...methodData.args);
	}
	// Handles recieved API from remote side
	const setRemoteApi = (serializedApi) => {
		let deserializedApi = serializer.deserialize(serializedApi, invokeRemoteApiMethod);
		Object.assign(api, deserializedApi);
	};
	// Will send the api to the remote side
	const init = (obj) => {
		localApi = obj;
		const serializedApi = serializer.serialize(obj);
		send(createApiData(Commands.INIT, serializedApi));
	};
	// Handle calls from remote side
	const handle = (data) => {
		if (!isApiData(data)) {
			throw new Error('not api data');
		}			
		data = parseApiData(data);
		switch (data.command) {
			case Commands.INIT:
				setRemoteApi(data.data);
				break;
			case Commands.INVOKE:
				invokeLocalApiMethod(parseMethodData(data.data));
				break;
			case Commands.INVOKE_WITH_CALLBACK:
				invokeLocalApiMethodWithCallback(parseMethodData(data.data));
				break;
			case Commands.INVOKE_CALLBACK:
				invokeLocalCallback(parseMethodData(data.data));
				break;
		}
	}
	// Return api
	return {
		init, handle, api
	};
};


module.exports = remoteapi;
