'use strict';
const net = require('net');
const jonremoteapi = require('../');

const serverApi = {
	log: str => console.log('Log from client:', str),
	add: (op1, op2, callback) => callback(op1+op2)
};

const server = net.createServer(socket => {
	let remoteApi = jonremoteapi(data => {
		socket.write(`API ${data}`);
	});
	remoteApi.init(serverApi);
	socket.on('data', data => {
		data = data.toString();
		if (data.startsWith('API ')) {
			remoteApi.handle(data.substring(4));
		}
	});
	socket.on('end', () => process.exit(0));
});

let address;
server.listen(() => {
	  address = server.address();
		console.log('opened server on %j', address);
		startClient();
});

// Create a client:
const startClient = () => {
	console.log('starting client');
	let server = {};

	let initialized = false;
	let apiInitialized = () => {
		server.api.add(1,2,result => {
			server.api.log(`1+2=${result}`);
			client.end();
		});
	};

	const client = net.connect(address, () => {
		server = jonremoteapi(data => {
			client.write(`API ${data}`);
		});
	});
	client.on('data', data => {
		data = data.toString();
		if (data.startsWith('API ')) {
			server.handle(data.substring(4));
			if (initialized == false) {
				initialized = true;
				apiInitialized();
			}
		}
	});
};


