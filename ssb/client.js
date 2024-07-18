var ssbClient = require('ssb-client')

ssbClient(function (err, sbot) {
  if (err)
    throw err

    sbot.whoami(function (err, info) {
        // info.id
        console.log("info.id:",info.id)
        console.log("info:",info)
      })

  // sbot is now ready. when done:
  sbot.close()
})

