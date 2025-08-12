// src/chat.ts
import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { webRTC } from '@libp2p/webrtc'
import { noise } from '@libp2p/noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { bootstrap } from '@libp2p/bootstrap'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'

// 1. 创建 libp2p 节点
const node = await createLibp2p({
  transports: [
    webSockets(),
    webRTC() // 启用 WebRTC 传输
  ],
  connectionEncryption: [noise()],
  streamMuxers: [yamux()],
  peerDiscovery: [
    bootstrap({
      list: [
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
        // 可以添加专用的信令/引导节点
      ]
    })
  ],
  services: {
    pubsub: gossipsub()
  }
})

// 2. 订阅聊天室主题
const topic = '/chat/room-1'
node.services.pubsub.subscribe(topic)

// 3. 监听消息
node.services.pubsub.addEventListener('message', (event) => {
  const { detail: message } = event
  if (message.topic === topic) {
    const text = new TextDecoder().decode(message.data)
    console.log('Received:', text)
    // 更新页面 UI
  }
})

// 4. 发送消息
async function sendMessage(text: string) {
  const data = new TextEncoder().encode(text)
  await node.services.pubsub.publish(topic, data)
  console.log('Sent:', text)
}

// 启动
await node.start()
console.log('Node started, listening on:', node.getMultiaddrs())