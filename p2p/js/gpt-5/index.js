const fs = require('fs')
const path = require('path')
const DHT = require('hyperdht')
const Hyperswarm = require('hyperswarm')
const minimist = require('minimist')
const { topicFromString } = require('./utils/topic')
const { frameAndPad } = require('./utils/padder')

async function main() {
    const argv = minimist(process.argv.slice(2), {
        string: ['topic', 'config', 'msg'],
        boolean: ['announce', 'lookup', 'useBtRouters', 'noStun'],
        default: {
            announce: true,
            lookup: true,
            useBtRouters: false,
            noStun: true, // 默认不依赖 STUN，仅用 DHT 打洞
            config: path.join(process.cwd(), 'config.json'),
            msg: '' // 可选：启动后自动发送一条消息
        }
    })

    // 读取配置（可用 config.example.json 拷贝为 config.json 并按需修改）
    let conf = {
        bootstrap: [],
        btDhtRouters: [],
        stunServers: [],
        fixedFrameBytes: 1024,
        heartbeatMs: 10000
    }
    if (fs.existsSync(argv.config)) {
        conf = Object.assign(conf, JSON.parse(fs.readFileSync(argv.config, 'utf8')))
    }

    // 组装 DHT（支持自定义 bootstrap）
    const dhtOptions = {}
    if (conf.bootstrap && conf.bootstrap.length > 0) {
        dhtOptions.bootstrap = conf.bootstrap
    }
    const dht = new DHT(dhtOptions)

    // 可选：将 BitTorrent DHT 路由器加入（hyperdht 可兼容作为额外引导）
    if (argv.useBtRouters && conf.btDhtRouters && conf.btDhtRouters.length) {
        if (!dhtOptions.bootstrap) dhtOptions.bootstrap = []
        dhtOptions.bootstrap.push(...conf.btDhtRouters)
    }

    const swarm = new Hyperswarm({ dht })

    // 从主题字符串派生 topic（与对端一致即可互相发现）
    if (!argv.topic) {
        console.error('必须指定 --topic "房间名或共享密钥"')
        process.exit(1)
    }
    const topic = topicFromString(argv.topic)

    // 加入 DHT：announce 发布自己、lookup 查找对端
    const discovery = swarm.join(topic, {
        announce: argv.announce,
        lookup: argv.lookup
    })
    await discovery.flushed() // 等待 announce/lookup 生效

    console.log('[node] joined DHT, topic =', argv.topic)
    swarm.on('connection', (socket, info) => {
        const pk = socket.remotePublicKey && socket.remotePublicKey.toString('hex')
        let addr = null
        try {
          // 尝试从底层 UDX 流取远端地址（在某些路径可用）
          if (socket.rawStream && typeof socket.rawStream.remoteAddress === 'function') {
            addr = socket.rawStream.remoteAddress()  // { host, port }
          } else if (socket.stream && typeof socket.stream.remoteAddress === 'function') {
            addr = socket.stream.remoteAddress()
          }
        } catch (e) {}
      
        console.log('[conn] peer connected', {
          client: info.client,                // 我方是否发起连接
          peerHost: info.peer && info.peer.host || null,
          peerPort: info.peer && info.peer.port || null,
          remoteAddr: addr,                   // 可能为 null
          remoteKey: pk ? (pk.slice(0, 16) + '...') : null
        })
        // socket 为端到端加密的双工流（Noise + UDP 打洞），不经服务器转发
        //console.log('[conn] peer connected from', info.peer && info.peer.host, info.peer && info.peer.port)

        // 心跳：固定周期发送填充帧，弱化时序侧信道
        const hb = setInterval(() => {
            try {
                const frame = frameAndPad(Buffer.from(''), conf.fixedFrameBytes)
                socket.write(frame)
            } catch (e) { }
        }, conf.heartbeatMs)

        socket.on('data', (data) => {
            // 收到固定帧；业务层自行去除填充，不暴露真实长度
            // 这里简单打印前 64 字节的十六进制（或根据协议解码）
            console.log('[recv]', data.slice(0, 64).toString('hex'), '... len=', data.length)
        })

        socket.on('close', () => clearInterval(hb))
        socket.on('error', () => clearInterval(hb))

        // 若 CLI 传了 --msg 启动即发一条消息（会被填充到固定帧）
        if (argv.msg && argv.msg.length) {
            const payload = Buffer.from(argv.msg)
            const frame = frameAndPad(payload, conf.fixedFrameBytes)
            socket.write(frame)
        }

        // 从 stdin 读入消息，每行作为一帧发送
        process.stdin.setEncoding('utf8')
        process.stdin.on('data', (line) => {
            const payload = Buffer.from(line.trim())
            try {
                const frame = frameAndPad(payload, conf.fixedFrameBytes)
                socket.write(frame)
            } catch (e) {
                console.error('发送失败：消息超过固定帧长（fixedFrameBytes）或其他错误', e.message)
            }
        })
    })
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})