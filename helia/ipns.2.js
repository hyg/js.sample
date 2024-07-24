import { createHelia } from 'helia'
import { ipns } from '@helia/ipns'
import { unixfs } from '@helia/unixfs'
import { CID } from 'multiformats/cid'
import { json } from '@helia/json'

const helia = await createHelia()
console.log("helia:",helia)

// store some data to publish
/*
const fs = unixfs(helia)
console.log("fs:",fs)

const cid = CID.parse("bafkreiaixnpf23vkyecj5xqispjq5ubcwgsntnnurw2bjby7khe4wnjihu")

for await (const buf of fs.cat(cid)) {
  console.info('cat bu cid:',buf)
}
*/

const name = ipns(helia)
console.log("name:",name)
const j = json(helia)
console.log("j:",j)

//const cid = CID.parse("bafzbeiedgxvd4c6sudmqrwoswe5kc3dqlopkqmcyidzosq6nntdqejwv7e")
//const peerId = await j.get(cid)
//const peerId = "QmbXWLrgz3rciF9rqGf59i6iKPmy3fdPNSFXTiYhYAK66W"
const peerId = await helia.libp2p.services.keychain.exportPeerId("my-key")
console.log("peerId:",peerId)

const result = await name.resolve(peerId)
console.log("result:",result)

/*
for await (const buf of fs.cat(result.cid)) {
  console.info('cat bu result.cid:',buf)
}
*/

const obj = await j.get(result.cid)
console.log("get by result.cid:",obj)
