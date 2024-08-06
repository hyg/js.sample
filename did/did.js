import { DID } from 'dids'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import * as KeyResolver from 'key-did-resolver'
import * as IPFS from 'ipfs-core'

const ipfs = await IPFS.create()

const seed = new Uint8Array(32);
//const seed = Uint8Array.from("Uint8Array 数组类型表示一个 8 位无符号整型数组..")// 32 bytes of entropy, Uint8Array
crypto.getRandomValues(seed);
const provider = new Ed25519Provider(seed)
const did = new DID({ provider, resolver: KeyResolver.getResolver() })

// Authenticate with the provider
await did.authenticate()

// Read the DID string - this will throw an error if the DID instance is not authenticated
const aliceDID = did.id

// Create a JWS - this will throw an error if the DID instance is not authenticated
//const jws = await did.createJWS({ hello: 'world' })

console.log("seed:",seed);
console.log("provider:",provider);
console.log("did:",did);
console.log("aliceDID:",aliceDID);
//console.log("jws:",jws);

const payload = { some: 'data' }

// sign the payload as dag-jose
const { jws, linkedBlock } = await did.createDagJWS(payload)
console.log("jws:",jws);
console.log("linkedBlock:",linkedBlock);

// put the JWS into the ipfs dag
const jwsCid = await ipfs.dag.put(jws, { storeCodec: 'dag-jose', hashAlg: 'sha2-256' })
console.log("jwsCid:",jwsCid);

// put the payload into the ipfs dag
const block = await ipfs.block.put(linkedBlock, { format: 'dag-cbor' })
console.log("block:",block);

// get the value of the payload using the payload cid
console.log((await ipfs.dag.get(jws.link)).value)
// output:
// > { some: 'data' }

// alternatively get it using the ipld path from the JWS cid
console.log((await ipfs.dag.get(jwsCid, { path: '/link' })).value)
// output:
// > { some: 'data' }

// get the jws from the dag
console.log((await ipfs.dag.get(jwsCid)).value)
// output:
// > {
// >   payload: 'AXESINDmZIeFXbbpBQWH1bXt7F2Ysg03pRcvzsvSc7vMNurc',
// >   signatures: [
// >     {
// >       protected: 'eyJraWQiOiJkaWQ6Mzp1bmRlZmluZWQ_dmVyc2lvbj0wI3NpZ25pbmciLCJhbGciOiJFUzI1NksifQ',
// >       signature: 'pNz3i10YMlv-BiVfqBbHvHQp5NH3x4TAHQ5oqSmNBUx1DH_MONa_VBZSP2o9r9epDdbRRBLQjrIeigdDWoXrBQ'
// >     }
// >   ],
// >   link: CID(bafyreigq4zsipbk5w3uqkbmh2w2633c5tcza2n5fc4x45s6soo54ynxk3q)
// > }