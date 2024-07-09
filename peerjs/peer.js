import {Peer} from "peerjs";
//const {Peer} = require("peerjs");

//import pkg from 'peerjs';
//const { Peer } = pkg;

var peer = new Peer();
//var peer = new Peer("my-test-web-2");
var conn = peer.connect("my-test-web-1");
conn.on("open", () => {
	conn.send("hi!");
});

peer.on("connection", (conn) => {
	conn.on("data", (data) => {
		// Will print 'hi!'
		console.log(data);
	});
	conn.on("open", () => {
		conn.send("hello!");
        conn.send('My peer ID is: ' + peer.id)
	});
});