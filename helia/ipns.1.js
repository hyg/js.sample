import { createHelia } from 'helia'
import { ipns } from '@helia/ipns'
import { unixfs } from '@helia/unixfs'
import { generateKeyPair } from '@libp2p/crypto/keys'

const helia = await createHelia()
const name = ipns(helia)

// create a keypair to publish an IPNS name
const privateKey = await generateKeyPair('Ed25519')

console.log("privateKey:",privateKey)
console.log("privateKey._publicKey:",privateKey._publicKey)

// store some data to publish
const fs = unixfs(helia)
const cid = await fs.addBytes(Uint8Array.from([0, 1, 2, 3, 4]))

// publish the name
await name.publish(privateKey, cid)

// resolve the name
const result = await name.resolve(privateKey.publicKey)

console.info(result.cid, result.path)
