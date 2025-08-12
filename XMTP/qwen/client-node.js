// XMTP Client Node
// This script starts an XMTP client node that sends messages to the bot node

import dotenv from 'dotenv';
dotenv.config();

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
  try {
    // Import the XMTP client from the local built SDK
    const { Client } = await import('./xmtp-js/sdks/node-sdk/dist/index.js');
    const { Wallet } = await import('ethers');
    
    // Load wallet from file or create new one
    const fs = await import('fs');
    const path = await import('path');
    const WALLET_FILE = path.join(process.cwd(), 'client-wallet.json');
    
    let wallet;
    if (fs.existsSync(WALLET_FILE)) {
      console.log('Loading existing client wallet...');
      const walletData = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
      wallet = new Wallet(walletData.privateKey);
    } else {
      console.log('Creating new client wallet...');
      wallet = Wallet.createRandom();
      // Save wallet to file
      fs.writeFileSync(WALLET_FILE, JSON.stringify({
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase
      }, null, 2));
      console.log('Client wallet saved to', WALLET_FILE);
    }

    // Create a signer
    const signer = await createSigner(wallet);
    
    // Create an XMTP client
    const xmtp = await Client.create(signer, { 
      env: 'dev',
      dbPath: path.join(process.cwd(), 'client.db3')
    });
    console.log('XMTP client created for address:', xmtp.accountIdentifier);
    
    return { xmtp, wallet };
  } catch (error) {
    console.error('Error initializing XMTP client:', error);
    throw error;
  }
}

async function sendMessageToBot(xmtp, botInboxId, message) {
  try {
    console.log(`Sending message to bot (${botInboxId}): ${message}`);
    
    // Create a new DM conversation with the bot
    const conversation = await xmtp.conversations.newDm(botInboxId);
    console.log('Created new DM conversation with bot');
    
    // Send the message
    const messageId = await conversation.send(message);
    console.log(`Message sent with ID: ${messageId}`);
    
    // Wait for and listen to the bot's response
    console.log('Waiting for bot response...');
    const messageStream = await conversation.stream();
    for await (const response of messageStream) {
      // Skip the message we just sent
      if (response.id !== messageId) {
        console.log(`Received response from bot: ${response.content}`);
        // Close the stream after receiving the response
        messageStream.return();
        break;
      } else {
        console.log(`Skipping message sent by client itself: ${response.content}`);
      }
    }
  } catch (error) {
    console.error('Error sending message to bot:', error);
  }
}

async function main() {
  console.log("Starting XMTP Client Node...");
  
  try {
    // Initialize XMTP client
    console.log("Initializing XMTP client...");
    const { xmtp, wallet } = await initializeXMTPClient();
    console.log("Client wallet address:", wallet.address);
    console.log("Client inbox ID:", xmtp.inboxId);
    
    // Read bot inbox ID from file
    const fs = await import('fs');
    const path = await import('path');
    const BOT_INBOX_ID_FILE = path.join(process.cwd(), 'bot-inbox-id.txt');
    
    if (!fs.existsSync(BOT_INBOX_ID_FILE)) {
      console.error('Bot inbox ID file not found. Please start the bot node first.');
      return;
    }
    
    const botInboxId = fs.readFileSync(BOT_INBOX_ID_FILE, 'utf8').trim();
    console.log("Bot inbox ID:", botInboxId);
    
    // Send a test message to the bot
    await sendMessageToBot(xmtp, botInboxId, "Hello bot! How are you?");
    
    console.log("Client node finished.");
  } catch (error) {
    console.error("Error in main:", error);
  }
}

main().catch(console.error);