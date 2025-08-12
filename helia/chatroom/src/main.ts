import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { webRTC } from '@libp2p/webrtc'
import { noise } from '@libp2p/noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { bootstrap } from '@libp2p/bootstrap'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'

// UI Elements
const roomControls = document.getElementById('room-controls')!
const chatContainer = document.getElementById('chat-container')!
const messagesDiv = document.getElementById('messages')!
const messageInput = document.getElementById('message-input') as HTMLInputElement
const sendButton = document.getElementById('send-button')!
const joinButton = document.getElementById('join-room-button')!
const roomNameInput = document.getElementById('room-name-input') as HTMLInputElement
const statusDiv = document.getElementById('status')!

let node: any
let topic: string

// 1. 创建 libp2p 节点
async function initNode() {
  statusDiv.innerHTML = '<p>正在初始化 P2P 节点...</p>'
  try {
    node = await createLibp2p({
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

    await node.start()
    console.log('Node started, listening on:', node.getMultiaddrs())
    statusDiv.innerHTML = '<p>节点初始化成功。请输入房间名并加入。</p>'
  } catch (err) {
    console.error('Failed to start libp2p node:', err)
    statusDiv.innerHTML = `<p style="color: red;">节点初始化失败: ${(err as Error).message}</p>`
  }
}

// 2. 加入聊天室
joinButton.addEventListener('click', async () => {
  const roomName = roomNameInput.value.trim()
  if (!roomName) {
    alert('请输入聊天室名称')
    return
  }

  topic = `/chat/${roomName}`
  try {
    // 订阅聊天室主题
    node.services.pubsub.subscribe(topic)
    console.log(`Subscribed to topic: ${topic}`)

    // 监听消息
    node.services.pubsub.addEventListener('message', (event: any) => {
      const { detail: message } = event
      if (message.topic === topic) {
        const text = new TextDecoder().decode(message.data)
        console.log('Received:', text)
        displayMessage(text, 'received')
      }
    })

    // 显示聊天界面
    roomControls.style.display = 'none'
    chatContainer.style.display = 'block'
    statusDiv.innerHTML = `<p>已加入聊天室: ${roomName}</p>`
    messageInput.focus()
  } catch (err) {
    console.error('Failed to join room:', err)
    statusDiv.innerHTML = `<p style="color: red;">加入聊天室失败: ${(err as Error).message}</p>`
  }
})

// 3. 发送消息
async function sendMessage(text: string) {
  if (!text.trim() || !node) return

  try {
    const data = new TextEncoder().encode(text)
    await node.services.pubsub.publish(topic, data)
    console.log('Sent:', text)
    displayMessage(text, 'sent')
    messageInput.value = ''
  } catch (err) {
    console.error('Failed to send message:', err)
    statusDiv.innerHTML = `<p style="color: red;">发送消息失败: ${(err as Error).message}</p>`
  }
}

sendButton.addEventListener('click', () => {
  sendMessage(messageInput.value)
})

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage(messageInput.value)
  }
})

// 4. 显示消息
function displayMessage(text: string, type: 'sent' | 'received') {
  const messageDiv = document.createElement('div')
  messageDiv.className = `message ${type}`
  messageDiv.textContent = text
  messagesDiv.appendChild(messageDiv)
  messagesDiv.scrollTop = messagesDiv.scrollHeight
}

// 初始化节点
initNode()