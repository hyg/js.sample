const redis = require('redis') // 引入 redis

const redisClient = redis.createClient() // 创建客户端

// 监听错误信息
redisClient.on('err', err => {
    console.log('redis client error: ', err)
})

// 连接
redisClient.connect(6379, '127.0.0.1').then(() => {
    redisClient.set('name', 'huangyg')
        .then(val => {
            console.log("set", val)
            redisClient.get('name').then(val => {
                console.log("get", val)
                redisClient.del('name').then(val => {
                    console.log("del", val)
                    redisClient.quit()
                })
            })
        })
})