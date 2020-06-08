const SDK = require('dat-sdk')

const sdk = await SDK();
const {
	Hypercore,
	Hyperdrive,
	resolveName,
	close
} = sdk

const SOME_URL = 'dat://0a9e202b8055721bd2bc93b3c9bbc03efdbda9cfee91f01a123fdeaadeba303e/'

const someArchive = Hyperdrive(SOME_URL)

console.log(await someArchive.readdir('/'))