// test.mjs
import { A2AClient } from '@a2a-js/sdk/client';

// Create a client instance
const client = new A2AClient('https://example.com');

console.log('Successfully imported A2AClient and created instance');

// Test getting the agent card
client.getAgentCard()
  .then(card => {
    console.log('Agent card retrieved:', card);
  })
  .catch(error => {
    console.error('Error retrieving agent card:', error.message);
  });