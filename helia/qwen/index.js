// Import the Helia library
const { createHelia } = require('helia')
const { tcp } = require('@libp2p/tcp')
const { webSockets } = require('@libp2p/websockets')
const { noise } = require('@libp2p/noise')
const { yamux } = require('@chainsafe/libp2p-yamux')

async function main () {
  // Create a new Helia node
  const helia = await createHelia({
    libp2p: {
      modules: {
        transports: [tcp(), webSockets()],
        streamMuxers: [yamux()],
        connectionEncryption: [noise()]
      }
    }
  })

  // Print the node's Peer ID
  console.log('Node started with Peer ID:', helia.libp2p.peerId.toString())
}

main()