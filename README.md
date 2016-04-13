# Jon Rempote API
Abstract communcation between applikations over your transport layer of choice.

## Example
A simple TCP server that has two methods; log and add. Log will log message to console and add will add two numbers and return the value via a callback.
```javascript
const net = require('net');
const remoteapi = require('jonremoteapi');

// Api the clients may use
const serverApi = {
	log: str => console.log('Log from client:', str),
	add: (op1, op2, callback) => callback(op1+op2)
};

// Create server
const server = net.createServer(socket => {
	// When a client connects, apply our API. We prefix all API calls with 'API '. This makes it possible to use the socket for other messages.
	let remoteApi = jonremoteapi(data => {
		socket.write(`API ${data}`);
	});
	// Specify the api:
	remoteApi.init(serverApi);
	// We need to check if a message is an API message or not and pass it to the remoteapi instance.
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
```
That's our server. Now, let's have a look at a client that will add two numbers and then sends the result to the server to log it.
```javascript
const net = require('net');
const remoteapi = require('jonremoteapi');

let server = {};
let initialized = false;

// As soon as the API is set up, perform add and send result to server
const apiInitialized = () => {
	// This is the magic :)
	server.api.add(1,2,result => {
		server.api.log(`1+2=${result}`);
		client.end();
	});
};
// We need to parse API calls and pass data to remoteapi instance
const client = net.connect(address, () => {
	server = jonremoteapi(data => {
		client.write(`API ${data}`);
	});
});
client.on('data', data => {
	data = data.toString();
	if (data.startsWith('API ')) {
		server.handle(data.substring(4));
		// If its the first time we receive API data we know we can start to use it.
		if (initialized == false) {
			initialized = true;
			apiInitialized();
		}
	}
});
```

