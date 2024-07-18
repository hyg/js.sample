import { createHelia } from 'helia'
import { ipns } from '@helia/ipns'
import { unixfs } from '@helia/unixfs'

const helia = await createHelia()
console.log("helia:",helia)
const start = await helia.start()
console.log("start:",start)

const name = ipns(helia)
console.log("name:",name)

// create a public key to publish as an IPNS name
const keyInfo = await helia.libp2p.services.keychain.createKey('my-key','rsa')
const peerId = await helia.libp2p.services.keychain.exportPeerId(keyInfo.name)
console.log("keyInfo:",keyInfo)
console.log("peerId:",peerId)

// store some data to publish
const fs = unixfs(helia)
console.log("fs:",fs)

const emptyDirCid = await fs.addDirectory()
console.log("emptyDirCid:",emptyDirCid)

const cid = await fs.addBytes(Uint8Array.from([0, 1, 2, 3, 4]))
console.log("cid:",cid)

// publish the name
await name.publish(peerId, cid)

// resolve the name
const result = await name.resolve(peerId)
console.log("result:",result)

console.info(result.cid, result.path)
