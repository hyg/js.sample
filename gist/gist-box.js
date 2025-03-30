const { GistBox } = require('gist-box')

const box = new GistBox({ id:"gist test", token:"xxx" })
await box.update({
  filename: 'example.md',
  description: 'A new description',
  content: 'The new content'
})