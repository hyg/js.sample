import Hypercore from "hypercore";

const core = new Hypercore('./core');

await core.ready();
console.log("core.id: ",core.id);
console.log("core.key: ",core.key);

// simple call append with a new block of data
await core.append(Buffer.from('I am a block of data'))

// pass an array to append multiple blocks as a batch
await core.append([Buffer.from('batch block 1'), Buffer.from('batch block 2')])

console.log("core:",core);

const updated = await core.update()

console.log('core was updated?', updated, 'length is', core.length)

//const has = await core.has(start, [end])
const has = await core.has(0)
console.log("has:",has);

// get block #42
const block = await core.get(2)

console.log("block 2:",block);