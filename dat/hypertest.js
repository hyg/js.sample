import * as SDK from "hyper-sdk"

const sdk = await SDK.create({
    // Specify the "storage" you want
    // Regular strings will be passed to `random-access-application` to store in your user directory
    // On web this will use `random-access-web` to choose the best storage based on the browser
    // You can specify an absolute or relative path `./example/` to choose where to store data
    // You can specify `false` to not persist data at all and do everything in-memory
    storage: 'hyper-sdk',

    // This controls whether the SDK will automatically start swarming when loading a core via `get`
    // Set this to false if you want to have more fine control over peer discovery
    autoJoin: true,

    // Specify options to pass to the Corestore constructor
    // The storage will get derived from the `storage` parameter
    // https://github.com/hypercore-protocol/corestore/
    corestoreOpts: {},

    // Specify options to pass to the hyperswarm constructor
    // The keypair will get derived automatically from the corestore
    // https://github.com/hyperswarm/hyperswarm
    swarmOpts: {},
})

console.log("sdk.publicKey:", sdk.publicKey);
console.log("sdk.connections:", sdk.connections);
console.log("sdk.peers:", sdk.peers);

const core = await sdk.get('example name')
//console.log("sdk.cores:",sdk.cores);
/*   file:///D:/huangyg/git/js.sample/dat/node_modules/hyper-sdk/index.js:100
    return [...this._cores.values()]
                           ^
TypeError: Cannot read properties of undefined (reading 'values') */

sdk.on('peer-add', (peerInfo) => {
    console.log('Connected to', peerInfo.publicKey, 'on', peerInfo.topics)
})
sdk.on('peer-remove', (peerInfo) => {
    console.log('Disconnected from', peerInfo.publicKey, 'on', peerInfo.topics)
})

const drive = await sdk.getDrive('hyper://blob.mauve.moe')
for(const path of drive.readdir('/')) {
  const stat = drive.stat(path)
}