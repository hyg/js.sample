const SDK = require('dat-sdk')

const sdk = await SDK();
const {
	Hypercore,
	Hyperdrive,
	resolveName,
	close
} = sdk

const archive = Hyperdrive('My archive name', {
  // This archive will disappear after the process exits
  // This is here so that running the example doesn't clog up your history
  persist: false,
  // storage can be set to an instance of `random-access-*`
  // const RAI = require('random-access-idb')
  // otherwise it defaults to `random-access-web` in the browser
  // and `random-access-file` in node
  storage: null  //storage: RAI
})

// You should wait for the archive to be totally initialized
await archive.ready()

const url = `dat://${archive.key.toString('hex')}`

// TODO: Save this for later!
console.log(`Here's your URL: ${url}`)

// Check out the hyperdrive docs for what you can do with it
// https://www.npmjs.com/package/hyperdrive#api
await archive.writeFile('/example.txt', 'Hello World!')
console.log('Written example file!')

const someArchive = Hyperdrive(url)

console.log(await someArchive.readdir('/'))