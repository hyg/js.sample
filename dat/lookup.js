import Hypercore from "hypercore";
import Hyperswarm from 'hyperswarm';

const core = new Hypercore('./clone', process.argv[2])

start()

async function start () {
  await core.ready()

  console.log("core.id: ",core.id);
  console.log("core.key: ",core.key);
  console.log("core:",core);

  const swarm = new Hyperswarm()
  swarm.on('connection', socket => core.replicate(socket))
  swarm.join(core.discoveryKey, { server: false, client: true })

  console.log((await core.get(2)).toString())
  console.log((await core.get(12)).toString())
  console.log((await core.get(22)).toString())
  console.log((await core.get(32)).toString())
  console.log((await core.get(42)).toString())
}