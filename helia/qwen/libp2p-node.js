// Import the libp2p library
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@libp2p/noise'
import { mplex } from '@libp2p/mplex'

console.log('Starting libp2p node...')

async function main () {
  console.log('Creating libp2p node configuration...')
  
  // Create a new libp2p node
  const node = await createLibp2p({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/0']
    },
    transports: [tcp(), webSockets()],
    streamMuxers: [mplex()],
    connectionEncryption: [noise()]
  })

  console.log('Libp2p node created successfully.')

  // Print the node's Peer ID
  console.log('Node started with Peer ID:', node.peerId.toString())

  // Print the node's multiaddrs
  console.log('Node multiaddrs:')
  node.getMultiaddrs().forEach((ma) => {
    console.log(ma.toString())
  })
}

console.log('Calling main function...')
main().catch(err => {
  console.error('Error in main function:', err)
})