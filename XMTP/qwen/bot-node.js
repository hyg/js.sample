// XMTP Bot Node
// This script starts an XMTP bot node that listens for messages and responds with Qwen AI

import dotenv from 'dotenv';
dotenv.config();

// Qwen AI configuration
const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

// Function to get response from Qwen AI
async function getQwenResponse(message) {
  if (!QWEN_API_KEY) {
    console.error('Please set the QWEN_API_KEY environment variable.');
    return "Qwen AI is not configured properly.";
  }

  try {
    const response = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`
      },
      body: JSON.stringify({
        "model": "qwen-turbo",
        "input": {
          "messages": [
            {
              "role": "user",
              "content": message
            }
          ]
        },
        "parameters": {
          "max_tokens": 512,
          "temperature": 0.8,
          "top_p": 0.8
        }
      })
    });

    const data = await response.json();
    if (data.output && data.output.text) {
      return data.output.text;
    } else {
      console.error('Unexpected response format from Qwen AI:', data);
      return "Sorry, I couldn't process that request.";
    }
  } catch (error) {
    console.error('Error calling Qwen AI:', error);
    return "Sorry, I'm having trouble connecting to the AI service.";
  }
}

// Create a custom signer for EOA (Externally Owned Account)
async function createSigner(wallet) {
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: wallet.address.toLowerCase(),
      identifierKind: 0  // Ethereum = 0, Passkey = 1
    }),
    signMessage: async (message) => {
      const signature = await wallet.signMessage(message);
      // Convert hex string to Uint8Array
      return new Uint8Array(Buffer.from(signature.slice(2), 'hex'));
    }
  };
}

// Initialize XMTP client
async function initializeXMTPClient() {
  console.log('Starting initializeXMTPClient...');
  try {
    console.log('Importing XMTP client and Ethers...');
    // Import the XMTP client from the local built SDK
    const { Client } = await import('./xmtp-js/sdks/node-sdk/dist/index.js');
    const { Wallet } = await import('ethers');
    const { generateInboxId } = await import('./xmtp-js/sdks/node-sdk/dist/index.js');
    console.log('XMTP client and Ethers imported successfully.');
    
    console.log('Setting up file paths...');
    // Load wallet from file or create new one
    const fs = await import('fs');
    const path = await import('path');
    const WALLET_FILE = path.join(process.cwd(), 'bot-wallet.json');
    console.log('File paths set up. Wallet file path:', WALLET_FILE);
    
    let wallet;
    if (fs.existsSync(WALLET_FILE)) {
      console.log('Loading existing bot wallet...');
      const walletData = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
      wallet = new Wallet(walletData.privateKey);
      console.log('Bot wallet loaded. Address:', wallet.address);
    } else {
      console.log('Creating new bot wallet...');
      wallet = Wallet.createRandom();
      // Save wallet to file
      fs.writeFileSync(WALLET_FILE, JSON.stringify({
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase
      }, null, 2));
      console.log('Bot wallet saved to', WALLET_FILE);
    }

    console.log('Creating signer...');
    // Create a signer
    const signer = await createSigner(wallet);
    console.log('Signer created successfully.');
    
    console.log('Creating XMTP client with dbPath:', path.join(process.cwd(), 'bot.db3'));
    // Create an XMTP client
    const xmtp = await Client.create(signer, { 
      env: 'dev',
      dbPath: path.join(process.cwd(), 'bot.db3')
    });
    console.log('XMTP bot client created for address:', xmtp.accountIdentifier);
    console.log('XMTP bot inbox ID:', xmtp.inboxId);
    
    return { xmtp, wallet };
  } catch (error) {
    console.error('Error initializing XMTP client:', error);
    throw error;
  }
}

async function listenForMessages(xmtp) {
  console.log('Bot is listening for messages...');
  
  try {
    console.log('Creating conversation stream...');
    // Create a message stream
    const stream = await xmtp.conversations.stream();
    console.log('Conversation stream created. Starting to iterate...');
    
    // Process each conversation as it comes in
    for await (const conversation of stream) {
      console.log(`New conversation started with inbox ID: ${conversation.id}`);
      
      // Handle each conversation in a separate async function to avoid blocking
      handleConversation(xmtp, conversation);
    }
  } catch (streamError) {
    console.error('Error creating or iterating conversation stream:', streamError);
    // Try to restart the stream after a delay
    console.log('Attempting to restart conversation stream in 5 seconds...');
    setTimeout(() => {
      listenForMessages(xmtp).catch(console.error);
    }, 5000);
  }
}

// Add a new function to listen for all messages directly
async function listenForAllMessages(xmtp) {
  console.log('Bot is listening for all messages...');
  
  try {
    console.log('Creating all messages stream...');
    // Create a stream for all messages
    const stream = await xmtp.conversations.streamAllMessages();
    console.log('All messages stream created. Starting to iterate...');
    
    // Process each message as it comes in
    for await (const message of stream) {
      console.log(`Received message from ${message.senderInboxId}: ${message.content}`);
      
      // Skip messages sent by the bot itself
      if (message.senderInboxId !== xmtp.inboxId) {
        // Get response from Qwen AI
        console.log('Getting response from Qwen AI...');
        const aiResponse = await getQwenResponse(message.content);
        console.log(`AI response generated: ${aiResponse}`);
        
        // Find the conversation for this message
        const conversation = await xmtp.conversations.getConversationById(message.conversationId);
        if (conversation) {
          // Send the AI response back
          console.log('Sending response back to sender...');
          await conversation.send(aiResponse);
          console.log('Response sent successfully.');
        } else {
          console.error('Could not find conversation for message');
        }
      } else {
        console.log('Skipping message sent by bot itself');
      }
    }
  } catch (streamError) {
    console.error('Error creating or iterating all messages stream:', streamError);
    // Try to restart the stream after a delay
    console.log('Attempting to restart all messages stream in 5 seconds...');
    setTimeout(() => {
      listenForAllMessages(xmtp).catch(console.error);
    }, 5000);
  }
}

async function handleConversation(xmtp, conversation) {
  try {
    console.log(`Creating message stream for conversation ${conversation.id}...`);
    // Listen for messages in this conversation
    const messageStream = await conversation.stream();
    console.log(`Message stream for conversation ${conversation.id} created. Starting to iterate...`);
    for await (const message of messageStream) {
      // Skip messages sent by the bot itself
      if (message.senderInboxId !== xmtp.inboxId) {
        console.log(`Received message from ${message.senderInboxId}: ${message.content()}`);
        
        // Get response from Qwen AI
        console.log('Getting response from Qwen AI...');
        const aiResponse = await getQwenResponse(message.content());
        console.log(`AI response generated: ${aiResponse}`);
        
        // Send the AI response back
        console.log('Sending response back to sender...');
        await conversation.send(aiResponse);
        console.log('Response sent successfully.');
      } else {
        console.log(`Skipping message sent by bot itself: ${message.content()}`);
      }
    }
  } catch (conversationError) {
    console.error(`Error in conversation ${conversation.id}:`, conversationError);
    // We don't re-throw the error to avoid stopping the entire message stream
  }
}

async function main() {
  console.log("Starting XMTP Bot Node...");
  
  try {
    // Test Qwen AI integration
    console.log("Testing Qwen AI integration...");
    const testResponse = await getQwenResponse("Hello, how are you?");
    console.log("Qwen AI test response:", testResponse);
    
    // Initialize XMTP client
    console.log("Initializing XMTP client...");
    const { xmtp, wallet } = await initializeXMTPClient();
    console.log("Bot wallet address:", wallet.address);
    console.log("Bot inbox ID:", xmtp.inboxId);
    
    // Save bot inbox ID to file for client to use
    console.log("Saving bot inbox ID to file...");
    const fs = await import('fs');
    const path = await import('path');
    fs.writeFileSync(path.join(process.cwd(), 'bot-inbox-id.txt'), xmtp.inboxId);
    console.log("Bot inbox ID saved to bot-inbox-id.txt");
    
    // Listen for all messages
    console.log("Starting to listen for all messages...");
    await listenForAllMessages(xmtp);
    
    console.log("Bot is running...");
  } catch (error) {
    console.error("Error in main:", error);
    // Exit with error code to indicate failure
    process.exit(1);
  }
}

main().catch(console.error);