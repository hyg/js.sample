var Dat = require('dat-node');


Dat('.  /', function (err, dat) {
  dat.joinNetwork()
  dat.network.on('connection', function () {
    console.log('I connected to someone!')
  })
})

/* // 1. Tell Dat where to download the files
Dat('D:\\huangyg\\git\\js.sample\\dat', {
  // 2. Tell Dat what link I want
  key: 'dat://f9dd4e35a26ba81c2a1d0c94f76f37caf0805605b1756d5d33ed370392e3bed7' // (a 64 character hash from above)
}, function (err, dat) {
  if (err) throw err

  // 3. Join the network & download (files are automatically downloaded)
  dat.joinNetwork()
}) */

/* 
// 1. My files are in /joe/cat-pic-analysis
Dat('D:\\huangyg\\git\\ego\\data\\draft\\2024 ', function (err, dat) {
  if (err) throw err

  // 2. Import the files
  dat.importFiles()

  // 3. Share the files on the network!
  dat.joinNetwork()
  // (And share the link)
  console.log('My Dat link is: dat://' + dat.key.toString('hex'))
}) */