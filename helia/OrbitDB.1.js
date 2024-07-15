import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB } from '@orbitdb/core'

const libp2p = await createLibp2p({ /* Libp2p options */ })
const ipfs = await createHelia({ libp2p }) // Helia is required for storage and network communication
const orbitdb = await createOrbitDB({ ipfs })
const mydb = await orbitdb.open('mydb')
console.log(mydb.address) // /orbitdb/zdpuAuK3BHpS7NvMBivynypqciYCuy2UW77XYBPUYRnLjnw13
await mydb.add("hello world!")