import { createHelia } from 'helia'
import { ipns } from '@helia/ipns'
import { unixfs } from '@helia/unixfs'
import { CID } from 'multiformats/cid'

const helia = await createHelia()
console.log("helia:",helia)

// store some data to publish
const fs = unixfs(helia)
console.log("fs:",fs)

const cid = CID.parse("bafkreiaixnpf23vkyecj5xqispjq5ubcwgsntnnurw2bjby7khe4wnjihu")

for await (const buf of fs.cat(cid)) {
  console.info('cat bu cid:',buf)
}

const name = ipns(helia)
console.log("name:",name)
const peerId = CID.parse("QmP5zqdzNMXxs2eSzBZXCTLLYHgvjMBpNM33sxhg6dYcTm")
console.log("peerId:",peerId)
const result = await name.resolve(peerId)
console.log("result:",result)
for await (const buf of fs.cat(result.cid)) {
  console.info('cat bu result.cid:',buf)
}

