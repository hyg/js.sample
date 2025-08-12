// src/index.ts
import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'

async function run() {
  try {
    const helia = await createHelia()
    const fs = unixfs(helia)

    const data = new TextEncoder().encode('Hello from Helia + Vite!')
    const cid = await fs.addBytes(data)
    console.log('File added with CID:', cid.toString())

    const chunks = []
    for await (const chunk of fs.cat(cid)) {
      chunks.push(chunk)
    }
    const text = new TextDecoder().decode(new Uint8Array(
      chunks.flatMap(chunk => Array.from(chunk))
    ))
    console.log('Retrieved content:', text)

    ;(window as any).helia = helia
    ;(window as any).cid = cid
  } catch (err) {
    console.error('Helia error:', err)
  }
}

run()