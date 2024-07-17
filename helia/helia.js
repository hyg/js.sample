import { createHelia } from 'helia'
import { strings } from '@helia/strings'
import { CID } from 'multiformats/cid'
import { base64 } from "multiformats/bases/base64"

const helia = await createHelia()
const s = strings(helia)

const myImmutableAddress = await s.add('hello world')
console.log(myImmutableAddress.toString())
console.log(await s.get(myImmutableAddress))

const s2 = strings(helia)
console.log(await s2.get(myImmutableAddress))

const h2 = await createHelia()
const s3 = strings(h2)
console.log(await s3.get(myImmutableAddress))

const addr =  CID.parse("bafkreifzjut3te2nhyekklss27nh3k72ysco7y32koao5eei66wof36n5e")
console.log(await s.get(addr))
