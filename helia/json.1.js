import { createHelia } from 'helia'
import { json } from '@helia/json'
import { CID } from 'multiformats/cid'

const helia = await createHelia()

const j = json(helia)
const cid = await j.add({
  hello: 'world'
})
console.log("cid:",cid)
const obj = await j.get(cid)

console.info(obj)
// { hello: 'world' }
