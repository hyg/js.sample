import { createHelia } from 'helia'
import { ipns } from '@helia/ipns'
import { unixfs } from '@helia/unixfs'
import { json } from '@helia/json'

const helia = await createHelia()
//console.log("helia:",helia)
//const start = await helia.start()
//console.log("start:",start)

const name = ipns(helia)
console.log("name:",name)

// create a public key to publish as an IPNS name
const keyInfo = await helia.libp2p.services.keychain.createKey('my-key','rsa')
const peerId = await helia.libp2p.services.keychain.exportPeerId(keyInfo.name)
console.log("keyInfo:",keyInfo)
console.log("peerId:",peerId)
console.log("peerId.multihash:",peerId.multihash)
console.log("peerId.privateKey:",peerId.privateKey)
console.log("peerId.publicKey:",peerId.publicKey)
console.log("peerId.type:",peerId.type)
console.log("peerId.toBytes():",peerId.toBytes())
console.log("peerId.toCID():",peerId.toCID())
console.log("peerId.toString():",peerId.toString())

// store some data to publish
//const fs = unixfs(helia)
//console.log("fs:",fs)

//const emptyDirCid = await fs.addDirectory()
//console.log("emptyDirCid:",emptyDirCid)

//const cid = await fs.addBytes(Uint8Array.from([0, 1, 2, 3, 4]))
//console.log("cid:",cid)

const j = json(helia)

const cid = await j.add({
  hello: 'world'
})
console.log("cid:",cid)

//const obj = await j.get(cid)
//console.info(obj)

// publish the name
await name.publish(peerId, cid)

// resolve the name
const result = await name.resolve(peerId)
console.log("result:",result)
//console.info(result.cid, result.path)
const obj = await j.get(result.cid)
console.info("get by result.cid:",obj)

/*
for await (const buf of fs.cat(cid)) {
  console.info('cat by cid:',buf)
}

for await (const buf of fs.cat(result.cid)) {
  console.info('cat by result.cid:',buf)
}
*/
