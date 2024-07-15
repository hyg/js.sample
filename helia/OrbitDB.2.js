// In another process
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB } from '@orbitdb/core'

const libp2p = await createLibp2p({ /* Libp2p options */ })
const ipfs = await createHelia({ libp2p }) // Helia is required for storage and network
const orbitdb = await createOrbitDB({ ipfs })
const theirdb = await orbitdb.open('/orbitdb/zdpuAuK3BHpS7NvMBivynypqciYCuy2UW77XYBPUYRnLjnw13')
for await (let record of theirdb.iterator()) {
  console.log(record)
}