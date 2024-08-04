import { DID } from 'dids'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import * as KeyResolver from 'key-did-resolver'

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
const jws = await did.createJWS({ hello: 'world' })

console.log("seed:",seed);
console.log("provider:",provider);
console.log("did:",did);
console.log("aliceDID:",aliceDID);
console.log("jws:",jws);
