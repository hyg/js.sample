const mqtt = require('mqtt');

// Node A (Trustee) configuration
const clientId = 'nodeA';
const topic = 'psmd/chat';
const brokerUrl = 'mqtt://broker.emqx.io:1883';

// Connect to MQTT broker
const client = mqtt.connect(brokerUrl, { clientId });

client.on('connect', () => {
  console.log('Node A connected to MQTT broker');
  client.subscribe(topic, (err) => {
    if (err) {
      console.error('Subscription error:', err);
    } else {
      console.log(`Node A subscribed to topic: ${topic}`);
    }
  });
});

client.on('message', (receivedTopic, message) => {
  if (receivedTopic === topic) {
    console.log(`Received message: ${message.toString()}`);
  }
});

// Handle user input
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  client.publish(topic, `Node A: ${input}`);
});