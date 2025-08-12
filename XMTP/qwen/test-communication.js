// test-communication.js
// This script tests the communication between the bot and client nodes

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

async function testCommunication() {
  console.log('Starting communication test...');
  
  // Start the bot node
  console.log('Starting bot node...');
  const botProcess = spawn('node', ['bot-node.js']);
  
  // Capture bot output
  let botOutput = '';
  botProcess.stdout.on('data', (data) => {
    const output = data.toString();
    botOutput += output;
    process.stdout.write(`[BOT] ${output}`);
  });
  
  botProcess.stderr.on('data', (data) => {
    const output = data.toString();
    botOutput += output;
    process.stderr.write(`[BOT] ${output}`);
  });
  
  // Wait a bit for the bot to initialize
  await setTimeout(5000);
  
  // Start the client node
  console.log('Starting client node...');
  const clientProcess = spawn('node', ['client-node.js']);
  
  // Capture client output
  let clientOutput = '';
  clientProcess.stdout.on('data', (data) => {
    const output = data.toString();
    clientOutput += output;
    process.stdout.write(`[CLIENT] ${output}`);
  });
  
  clientProcess.stderr.on('data', (data) => {
    const output = data.toString();
    clientOutput += output;
    process.stderr.write(`[CLIENT] ${output}`);
  });
  
  // Wait for the client to finish, with a timeout
  const clientFinished = new Promise((resolve) => {
    clientProcess.on('close', resolve);
  });
  
  // Set a timeout for the test
  const timeout = setTimeout(30000); // 30 seconds timeout
  
  // Wait for either the client to finish or the timeout
  await Promise.race([clientFinished, timeout]);
  
  // Kill both processes
  console.log('Stopping bot and client nodes...');
  botProcess.kill();
  clientProcess.kill();
  
  // Wait a bit for processes to terminate
  await setTimeout(2000);
  
  // Analyze the output
  console.log('\n--- TEST ANALYSIS ---');
  if (botOutput.includes('Received message from') && botOutput.includes('Sending response back to sender')) {
    console.log('✅ SUCCESS: Bot received message and sent response');
  } else if (botOutput.includes('Received message from')) {
    console.log('⚠️  PARTIAL: Bot received message but may not have sent response');
  } else {
    console.log('❌ FAILURE: Bot did not receive message');
  }
  
  if (clientOutput.includes('Received response from bot')) {
    console.log('✅ SUCCESS: Client received response from bot');
  } else if (clientOutput.includes('Message sent with ID')) {
    console.log('⚠️  PARTIAL: Client sent message but did not receive response');
  } else {
    console.log('❌ FAILURE: Client did not send message');
  }
  
  console.log('Communication test completed.');
}

testCommunication().catch(console.error);