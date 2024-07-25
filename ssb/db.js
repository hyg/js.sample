const SecretStack = require('secret-stack')
const caps = require('ssb-caps')

console.log(caps) // JSON object: {shs, sign}
console.log(caps.shs) // this is a string to be interpreted as base64
console.log(caps.sign) // this is so far null

const sbot = SecretStack({ caps })
  .use(require('ssb-db2'))
  .call(null, { path: './' })

sbot.db.create({ content: { type: 'post', text: 'hello!' } }, (err, msg) => {
  // A new message is now published on the log, with the contents above.
  console.log(msg)
  /*
  {
    key,
    value: {
      previous: null,
      sequence: 1,
      author,
      timestamp: 1633715006539,
      hash: 'sha256',
      content: { type: 'post', text: 'hello!' },
      signature,
    },
    timestamp: 1633715006540
  }
  */
})