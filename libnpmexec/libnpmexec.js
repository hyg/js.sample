const libexec = require('libnpmexec')

libexec({
  args: ['yosay', 'Bom dia!'],
  cache: '~/.npm/_cacache',
  npxCache: '~/.npm/_npx',
  yes: true
})