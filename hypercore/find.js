const hyperswarm = require('hyperswarm')
const crypto = require('crypto')

const swarm = hyperswarm()

// look for peers listed under this topic
const topic = crypto.createHash('sha256')
  .update('PSMD')
  .digest()

swarm.join(topic, {
  lookup: true, // find & connect to peers
  announce: true // optional- announce self as a connection target
})

swarm.on('connection', (socket, details) => {
  console.log('new connection!', details)

  // you can now use the socket as a stream, eg:
  // process.stdin.pipe(socket).pipe(process.stdout)
})