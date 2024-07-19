import { createHelia } from 'helia'
import { json } from '@helia/json'
import { CID } from 'multiformats/cid'

const helia = await createHelia()
const j = json(helia)
const cid = CID.parse("bagaaierasords4njcts6vs7qvdjfcvgnume4hqohf65zsfguprqphs3icwea")
const obj = await j.get(cid)

console.info(obj)
// { hello: 'world' }
