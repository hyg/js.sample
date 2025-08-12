# XMTP + Qwen AI Chatbot

This project implements a chatbot that uses XMTP for decentralized messaging and Qwen AI for intelligent responses.

## Project Structure

- `bot-node.js`: The main bot implementation that listens for messages and responds with AI-generated content
- `client-node.js`: A test client that sends messages to the bot
- `index.js`: Alternative implementation of the bot (not actively used)
- `ARCHITECTURE.md`: Detailed architecture documentation
- `IMPLEMENTATION_PLAN.md`: Implementation plan and progress tracking

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file with your Qwen API key:
   ```
   QWEN_API_KEY=your_api_key_here
   ```

## Running the Bot

1. Start the bot node:
   ```
   node bot-node.js
   ```

2. In another terminal, run the client to send a test message:
   ```
   node client-node.js
   ```

## Automated Testing

You can also run an automated test that starts both nodes and verifies communication:
```
node test-communication.js
```

## How It Works

1. The bot creates an XMTP client with a wallet and listens for incoming messages using `streamAllMessages()`
2. When it receives a message, it sends the content to Qwen AI for processing
3. The AI response is then sent back to the original sender through XMTP

## Troubleshooting

If you encounter issues:

1. Ensure your Qwen API key is correctly set in the `.env` file
2. Check that you're using a compatible Node.js version (18+)
3. Make sure both nodes are running in the dev environment
4. Verify that the bot node is still running when you start the client node

## Recent Improvements

- Fixed message handling in both bot and client nodes
- Improved error handling and logging
- Added automated testing script
- Implemented proper stream management for XMTP messages