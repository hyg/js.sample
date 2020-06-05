var Dat = require('dat-node')

// 1. Tell Dat where to download the files
Dat('download/PSMD', {
  // 2. Tell Dat what link I want
  //key: 'adc78b18e36e0944e7dd7e77074ac083a49a0e837ddfbb1b0d43cbe06782f7a8' // (a 64 character hash from above)
  key: '1a2c14495c5228d5441b2c5077db471e553e6a3b20c665eb1bcb00f4ca94da63'
}, function (err, dat) {
  if (err) throw err

  // 3. Join the network & download (files are automatically downloaded)
  dat.joinNetwork()
})