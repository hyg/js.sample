const Peer = require('simple-peer')
const wrtc = require('wrtc')
const readline = require('readline')

// 创建命令行交互接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// 初始化接收方
const peer = new Peer({
  initiator: false, // 非发起方
  wrtc: wrtc,
  trickle: false
})

// 监听连接建立
peer.on('connect', () => {
  console.log('✅ 与发起方建立连接成功！')
  console.log('请输入要发送的消息（输入 exit 退出）：')
  
  // 读取用户输入并发送
  rl.on('line', (message) => {
    if (message === 'exit') {
      peer.destroy()
      rl.close()
      process.exit(0)
    }
    peer.send(message)
  })
})

// 监听接收数据
peer.on('data', (data) => {
  console.log(`\n📥 收到发起方消息：${data.toString()}`)
  process.stdout.write('请输入消息：') // 保持输入提示
})

// 生成连接信号（需要手动传递给发起方）
peer.on('signal', (data) => {
  console.log('\n📤 接收方连接信息（请复制给发起方）：')
  console.log(JSON.stringify(data))
  process.stdout.write('等待发起方确认...\n')
})

// 接收用户输入的发起方信号
console.log('请粘贴发起方的连接信息并按回车：')
rl.once('line', (initiatorSignal) => {
  try {
    // 解析并处理发起方的信号
    const signal = JSON.parse(initiatorSignal)
    peer.signal(signal)
    console.log('已处理发起方信号，正在建立连接...')
  } catch (err) {
    console.error('❌ 解析信号失败，请检查输入是否正确：', err)
    process.exit(1)
  }
})

// 错误处理
peer.on('error', (err) => {
  console.error('❌ 发生错误：', err)
  peer.destroy()
  process.exit(1)
})
    