// Import the Helia library
const { createHelia } = require('helia')
const { tcp } = require('@libp2p/tcp')
const { webSockets } = require('@libp2p/websockets')
const { noise } = require('@libp2p/noise')
const { yamux } = require('@chainsafe/libp2p-yamux')
const { multiaddr } = require('@multiformats/multiaddr')

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

  // Print the node's multiaddrs
  console.log('Node multiaddrs:')
  helia.libp2p.getMultiaddrs().forEach((ma) => {
    console.log(ma.toString())
  })

  // If a multiaddr is provided as an argument, connect to it
  if (process.argv[2]) {
    const ma = multiaddr(process.argv[2])
    console.log(`Connecting to ${ma}`)
    await helia.libp2p.dial(ma)
    console.log(`Connected to ${ma}`)
  }

  // Listen for incoming connections
  helia.libp2p.addEventListener('peer:connect', (evt) => {
    console.log('Connected to:', evt.detail.toString())
  })

  // Listen for incoming messages
  helia.libp2p.addEventListener('peer:disconnect', (evt) => {
    console.log('Disconnected from:', evt.detail.toString())
  })

  // Send a message to all connected peers
  process.stdin.on('data', async (data) => {
    const message = data.toString().trim()
    if (message === '') return

    // Get all connected peers
    const peers = helia.libp2p.getConnections().map(conn => conn.remotePeer)

    // Send the message to each peer
    for (const peer of peers) {
      try {
        const stream = await helia.libp2p.dialProtocol(peer, '/chat/1.0.0')
        const writer = stream.sink
        await writer([new TextEncoder().encode(message)])
        await stream.close()
      } catch (err) {
        console.error('Error sending message to peer:', peer.toString(), err)
      }
    }
  })
}

main()