// test.ts
import { A2AClient } from '@a2a-js/sdk/client';
import type { AgentCard } from '@a2a-js/sdk';

// Create a client instance
const client = new A2AClient('https://example.com');

console.log('Successfully imported A2AClient and created instance');

// Test getting the agent card with TypeScript typing
client.getAgentCard()
  .then((card: AgentCard) => {
    console.log('Agent card retrieved:', card);
    console.log('Agent name:', card.name); // TypeScript will provide autocomplete
  })
  .catch(error => {
    console.error('Error retrieving agent card:', error.message);
  });