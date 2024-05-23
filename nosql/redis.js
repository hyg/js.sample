const redis = require('redis') // 引入 redis

const redisClient = redis.createClient() // 创建客户端

// 监听错误信息
redisClient.on('err', err => {
  console.log('redis client error: ', err)
})

// 连接
redisClient.connect(6379, '192.168.3.69').then(() => {
  redisClient.set('name', 'PSMD')
    .then(val => {
      console.log(val)
    })
})