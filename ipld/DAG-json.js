import { encode, decode } from '@ipld/dag-json'
import { CID } from 'multiformats'

const obj = {
  x: 1,
  /* CID instances are encoded as links */
  y: [2, 3, CID.parse('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4')],
  z: {
    a: CID.parse('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4'),
    b: null,
    c: 'string'
  }
}
//console.log("CID:", CID.parse('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4'))
let data = encode(obj)
console.log("data:",data)
let decoded = decode(data)
console.log("decoded:",decoded)
console.log("decoded.y[0]",decoded.y[0]) // 2
console.log("CID.asCID(decoded.z.a):",CID.asCID(decoded.z.a)) // cid instance