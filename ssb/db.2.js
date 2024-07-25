const SecretStack = require('secret-stack')
const caps = require('ssb-caps')
const { where, and, type, author, toCallback } = require('ssb-db2/operators')

const sbot = SecretStack({ caps })
  .use(require('ssb-db2'))
  .call(null, { path: './' })

sbot.db.query(
  where(
    and(
      type('post'),
      author('@6CAxOI3f+LUOVrbAl0IemqiS7ATpQvr9Mdw9LC4+Uv0=.ed25519')
    )
  ),
  toCallback((err, msgs) => {
    console.log(
      'There are ' + msgs.length + ' messages of type "post" from arj'
    )
    sbot.close()
  })
)