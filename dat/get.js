var Dat = require('dat-node')

// 1. Tell Dat where to download the files
Dat('download/PSMD', {
  // 2. Tell Dat what link I want
  key: 'adc78b18e36e0944e7dd7e77074ac083a49a0e837ddfbb1b0d43cbe06782f7a8' // (a 64 character hash from above)
}, function (err, dat) {
  if (err) throw err

  // 3. Join the network & download (files are automatically downloaded)
  dat.joinNetwork()
})