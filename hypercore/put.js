var hypercore = require('hypercore')
var feed = hypercore('put', {valueEncoding: 'utf-8'})

feed.append('hello', function (err) {
  if (err) throw err
  console.log(feed.key)
  feed.get(0, console.log) // prints hello
})
console.log(feed.key)
feed.append('world', function (err) {
  if (err) throw err
  console.log(feed.key)
  feed.get(0, console.log) // prints hello
  feed.get(1, console.log) // prints world
})

feed.flush(function () {
  console.log('Appended 3 more blocks, %d in total (%d bytes)\n', feed.length, feed.byteLength)

  feed.createReadStream()
    .on('data', console.log)
    .on('end', console.log.bind(console, '\n(end)'))
})