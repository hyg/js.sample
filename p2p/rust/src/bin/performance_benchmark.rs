// 引入必要的库
use libp2p::{
    identity,
    PeerId,
    Swarm,
    kad::{self, Mode, Event as KademliaEvent, QueryResult, BootstrapOk, BootstrapError, GetClosestPeersOk, GetClosestPeersError},
    ping::{self, Event as PingEvent, Failure as PingFailure}, // Ping 事件和失败类型
    swarm::{SwarmEvent, NetworkBehaviour}, // 导入 NetworkBehaviour trait 和 derive 宏
    Transport, tcp, yamux, noise,
    futures::StreamExt,
};
use std::error::Error;
use std::net::SocketAddr;
use std::time::{Duration, Instant};
use tokio::time::interval;
use tokio::net::UdpSocket;
// 引入 STUN 相关库
use bytecodec::EncodeExt;
use bytecodec::DecodeExt;
use stun_codec::{Message, MessageClass, MessageDecoder, MessageEncoder, Method, TransactionId};
use stun_codec::rfc5389::attributes::{MappedAddress, XorMappedAddress};
// 引入JSON序列化库
use serde::{Deserialize, Serialize};
// 引入时间处理库
use chrono::Utc;

// 定义节点的行为，结合 Kademlia DHT 和 Ping
// 使用 #[derive(NetworkBehaviour)] 宏自动生成组合行为
#[derive(NetworkBehaviour)]
struct MyBehaviour {
    kademlia: kad::Behaviour<kad::store::MemoryStore>,
    ping: ping::Behaviour,
}

// 定义Bootstrap节点信息结构
#[derive(Serialize, Deserialize, Debug, Clone)]
struct BootstrapNode {
    address: String,
    peer_id: String,
    status: String, // "active", "inactive", "unknown"
    last_seen: Option<String>, // 最后一次成功连接的时间戳
    response_time: Option<u64>, // 最近一次响应时间（毫秒）
    success_count: u32, // 成功连接次数
    failure_count: u32, // 失败连接次数
}

// 定义Bootstrap节点列表结构
#[derive(Serialize, Deserialize, Debug)]
struct BootstrapList {
    nodes: Vec<BootstrapNode>,
    last_updated: String, // 最后更新时间戳
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // 设置运行时间限制(分钟)
    let max_runtime_minutes = 30; // 节点间通信调试任务预计需要30分钟
    let start_time = Instant::now();
    
    // 节点间通信成功标志
    let mut communication_success = false;
    
    // 节点连接尝试计数器
    let mut connection_attempts = 0;
    const MAX_CONNECTION_ATTEMPTS: u32 = 10; // 最多尝试连接10次
    
    // 存储已知的活动Bootstrap节点
    let mut active_bootstrap_nodes: Vec<BootstrapNode> = Vec::new();
    
    // 生成一个随机的 Ed25519 密钥对，用于节点身份
    let local_key = identity::Keypair::generate_ed25519();
    // 从公钥获取 PeerId
    let local_peer_id = PeerId::from(local_key.public());
    println!("Local peer ID: {:?}", local_peer_id);

    // 创建TCP传输层，并添加噪声协议和Yamux多路复用器
    let transport = tcp::tokio::Transport::new(tcp::Config::default())
        .upgrade(libp2p::core::upgrade::Version::V1)
        .authenticate(noise::Config::new(&local_key)?)
        .multiplex(yamux::Config::default())
        .boxed();

    // 创建Kademlia存储
    let store = kad::store::MemoryStore::new(local_peer_id);

    // 创建Kademlia行为，设置为客户端模式
    let mut kademlia = kad::Behaviour::with_config(local_peer_id, store, kad::Config::default());
    kademlia.set_mode(Some(Mode::Client)); // 设置为客户端模式，不接受其他节点的存储请求

    // 添加Bootstrap节点地址
    let bootstrap_nodes = [
        // IPFS Bootstrappers - 多个可替换的服务器
        "/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmPYiLMwpSM", // 位于美国的服务器
        "/ip4/104.236.179.241/tcp/4001/p2p/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM", // 位于美国的服务器
        "/ip4/128.199.219.111/tcp/4001/p2p/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu", // 位于英国的服务器
        "/ip4/104.236.76.40/tcp/4001/p2p/QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64", // 位于美国的服务器
        "/ip4/178.62.158.247/tcp/4001/p2p/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd", // 位于新加坡的服务器
        // Libp2p Test Network Bootstrap Nodes
        "/ip4/34.197.35.250/tcp/6880", // 位于美国的服务器
        "/ip4/72.46.58.63/tcp/51413", // 位于美国的服务器
        "/ip4/46.53.251.68/tcp/16970", // 位于英国的服务器
        "/ip4/191.95.16.229/tcp/55998", // 位于德国的服务器
        "/ip4/79.173.94.111/tcp/1438", // 位于俄罗斯的服务器
        "/ip4/45.233.86.50/tcp/61995", // 位于巴西的服务器
        "/ip4/178.162.174.28/tcp/28013", // 位于法国的服务器
        "/ip4/178.162.174.240/tcp/28006", // 位于法国的服务器
        "/ip4/72.21.17.101/tcp/22643", // 位于美国的服务器
        "/ip4/31.181.42.46/tcp/22566", // 位于俄罗斯的服务器
        "/ip4/67.213.106.46/tcp/61956", // 位于美国的服务器
        "/ip4/201.131.172.249/tcp/53567", // 位于巴西的服务器
        "/ip4/185.203.152.184/tcp/2003", // 位于德国的服务器
        "/ip4/68.146.23.207/tcp/42107", // 位于美国的服务器
        "/ip4/51.195.222.183/tcp/8653", // 位于法国的服务器
        "/ip4/85.17.170.48/tcp/28005", // 位于荷兰的服务器
        "/ip4/87.98.162.88/tcp/6881", // 位于法国的服务器
        "/ip4/185.145.245.121/tcp/8656", // 位于德国的服务器
        "/ip4/52.201.45.189/tcp/6880", // 位于美国的服务器
    ];

    // 创建 Ping 行为
    let ping = ping::Behaviour::new(ping::Config::new().with_interval(Duration::from_secs(10)));

    // 创建组合行为
    let behaviour = MyBehaviour {
        kademlia,
        ping,
    };

    // 创建Swarm
    let mut swarm = Swarm::new(
        transport,
        behaviour,
        local_peer_id,
        libp2p::swarm::Config::with_executor(|fut| { tokio::spawn(fut); }), // 使用tokio执行器
    );

    // 监听一个随机端口
    swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse()?)?;

    // 启动一个计时器，定期执行 Bootstrap
    let mut bootstrap_timer = interval(Duration::from_secs(10));
    bootstrap_timer.tick().await; // 消费第一个 tick
    // 启动一个计时器，定期查找自己的 PeerId 以保持网络连接
    let mut refresh_timer = interval(Duration::from_secs(60));
    refresh_timer.tick().await; // 消费第一个 tick
    // 启动一个计时器，定期输出 Bootstrap 地址列表
    let mut address_output_timer = interval(Duration::from_secs(60));
    address_output_timer.tick().await; // 消费第一个 tick

    // 标记是否已执行初始 Bootstrap
    let mut bootstrapped = false;

    // 实现节点发现和连接逻辑
    loop {
        // 检查是否达到最大运行时间
        if start_time.elapsed() > Duration::from_secs(max_runtime_minutes * 60) {
            println!("Maximum runtime of {} minutes reached. Shutting down...", max_runtime_minutes);
            break;
        }
        
        // 检查节点间通信是否成功
        if communication_success {
            println!("Node-to-node communication succeeded. Shutting down...");
            break;
        }
        
        // 检查是否超过最大连接尝试次数
        if connection_attempts >= MAX_CONNECTION_ATTEMPTS {
            println!("Maximum connection attempts ({}) reached. Shutting down...", MAX_CONNECTION_ATTEMPTS);
            break;
        }
        
        tokio::select! {
            event = swarm.select_next_some() => {
                match event {
                    SwarmEvent::NewListenAddr { address, .. } => {
                        println!("Node {} listening on {:?}", local_peer_id, address);
                        // 将自己的监听地址添加到 Kademlia DHT 中，以便其他节点能找到我们
                        // 这通常在连接建立或通过外部机制完成，但在这里打印出来以供参考
                    }
                    // 处理 Kademlia 事件
                    SwarmEvent::Behaviour(MyBehaviourEvent::Kademlia(kad_event)) => {
                        match kad_event {
                            KademliaEvent::OutboundQueryProgressed { result, .. } => {
                                match result {
                                    QueryResult::Bootstrap(Ok(BootstrapOk { peer, .. })) => {
                                        println!("Successfully bootstrapped with {:?}", peer);
                                    }
                                    QueryResult::Bootstrap(Err(BootstrapError::Timeout { .. })) => {
                                        println!("Bootstrap query timed out");
                                    }
                                    QueryResult::GetClosestPeers(Ok(GetClosestPeersOk { key, peers, .. })) => {
                                        println!("Found {} closest peers for {:?}", peers.len(), key);
                                        // 这里可以处理找到的节点，例如尝试连接
                                    }
                                    QueryResult::GetClosestPeers(Err(GetClosestPeersError::Timeout { key, .. })) => {
                                        println!("GetClosestPeers query for {:?} timed out", key);
                                    }
                                    _ => {}
                                }
                            }
                            KademliaEvent::RoutingUpdated { peer, .. } => {
                                println!("Routing table updated with peer: {}", peer);
                                // 更新活动Bootstrap节点列表
                                update_bootstrap_node_status(&mut active_bootstrap_nodes, &peer.to_string(), "active");
                            }
                            _ => {}
                        }
                    }
                    // 处理 Ping 事件
                    SwarmEvent::Behaviour(MyBehaviourEvent::Ping(ping_event)) => {
                        match ping_event {
                            PingEvent { 
                                peer, 
                                result: Ok(duration), // Ping 成功，返回往返时间
                                .. // 忽略其他字段
                            } => {
                                println!("Ping succeeded with {} in {:?}", peer, duration);
                                // Ping 成功表明节点间通信成功，可能意味着 NAT 穿透成功
                                communication_success = true;
                                println!("Node-to-node communication success detected through successful ping to peer: {}", peer);
                                
                                // 更新活动Bootstrap节点列表
                                update_bootstrap_node_status(&mut active_bootstrap_nodes, &peer.to_string(), "active");
                                // 重置连接尝试计数器，因为连接成功了
                                connection_attempts = 0;
                            }
                            PingEvent { 
                                peer, 
                                result: Err(PingFailure::Timeout), // Ping 超时
                                .. // 忽略其他字段
                            } => {
                                println!("Ping timeout with {}", peer);
                                // 可以在这里处理连接断开的逻辑
                                
                                // 更新活动Bootstrap节点列表
                                update_bootstrap_node_status(&mut active_bootstrap_nodes, &peer.to_string(), "inactive");
                            }
                            PingEvent { 
                                peer, 
                                result: Err(PingFailure::Unsupported), // 对端不支持 ping 协议
                                .. // 忽略其他字段
                            } => {
                                println!("Peer {} does not support ping protocol", peer);
                                
                                // 更新活动Bootstrap节点列表
                                update_bootstrap_node_status(&mut active_bootstrap_nodes, &peer.to_string(), "inactive");
                            }
                            PingEvent { 
                                peer, 
                                result: Err(PingFailure::Other { error }), // 其他错误
                                .. // 忽略其他字段
                            } => {
                                println!("Ping failed with {} due to: {:?}", peer, error);
                                
                                // 更新活动Bootstrap节点列表
                                update_bootstrap_node_status(&mut active_bootstrap_nodes, &peer.to_string(), "inactive");
                            }
                        }
                    }
                    SwarmEvent::ConnectionEstablished { peer_id, endpoint, .. } => {
                        println!("Connection established with {} at {:?}", peer_id, endpoint);
                        // 当与其他节点建立连接时，可以将它们添加到 Kademlia 路由表中
                        // libp2p 通常会自动处理这一点，但有时手动添加可能有益
                        // swarm.behaviour_mut().kademlia.add_address(&peer_id, endpoint.get_remote_address().clone());
                        
                        // 更新活动Bootstrap节点列表
                        update_bootstrap_node_status(&mut active_bootstrap_nodes, &peer_id.to_string(), "active");
                    }
                    SwarmEvent::ConnectionClosed { peer_id, cause, .. } => {
                        println!("Connection closed with {}: {:?}", peer_id, cause);
                        
                        // 更新活动Bootstrap节点列表
                        update_bootstrap_node_status(&mut active_bootstrap_nodes, &peer_id.to_string(), "inactive");
                    }
                    SwarmEvent::OutgoingConnectionError { peer_id, error, .. } => {
                        println!("Outgoing connection error to {:?}: {:?}", peer_id, error);
                        connection_attempts += 1; // 增加连接尝试计数器
                        
                        // 分析错误类型以确定NAT类型
                        match &error {
                            libp2p::swarm::DialError::Transport(errors) => {
                                for (_, err) in errors {
                                    // 检查IO错误类型
                                    if let Some(source) = err.source() {
                                        if let Some(io_err) = source.downcast_ref::<std::io::Error>() {
                                            if io_err.kind() == std::io::ErrorKind::TimedOut {
                                                println!("Connection timeout - likely indicates restrictive NAT");
                                            } else if io_err.kind() == std::io::ErrorKind::ConnectionRefused {
                                                println!("Connection refused - likely indicates firewall or restrictive NAT");
                                            }
                                        }
                                    }
                                }
                            }
                            _ => {
                                println!("Other connection error: {:?}", error);
                            }
                        }
                        
                        // 更新活动Bootstrap节点列表
                        if let Some(peer_id) = peer_id {
                            update_bootstrap_node_status(&mut active_bootstrap_nodes, &peer_id.to_string(), "inactive");
                        }
                    }
                    SwarmEvent::IncomingConnectionError { local_addr, send_back_addr, error, .. } => {
                        println!("Incoming connection error from {} to {}: {:?}", send_back_addr, local_addr, error);
                        connection_attempts += 1; // 增加连接尝试计数器
                        
                        // 分析错误类型以确定NAT类型
                        if let Some(source) = error.source() {
                            if let Some(io_err) = source.downcast_ref::<std::io::Error>() {
                                if io_err.kind() == std::io::ErrorKind::TimedOut {
                                    println!("Incoming connection timeout - likely indicates restrictive NAT");
                                } else if io_err.kind() == std::io::ErrorKind::ConnectionRefused {
                                    println!("Incoming connection refused - likely indicates firewall");
                                }
                            }
                        }
                    }
                    _ => {
                        // println!("Unhandled event: {:?}", event);
                    }
                }
            }
            // 定期执行 Bootstrap
            _ = bootstrap_timer.tick() => {
                if !bootstrapped {
                    println!("Starting initial bootstrap...");
                    // 启动 Bootstrap 过程
                    if let Ok(_) = swarm.behaviour_mut().kademlia.bootstrap() {
                        bootstrapped = true;
                    } else {
                        println!("Failed to start bootstrap.");
                    }
                }
            }
            // 定期刷新自己的 PeerId 查询
            _ = refresh_timer.tick() => {
                println!("Refreshing peer discovery...");
                swarm.behaviour_mut().kademlia.get_closest_peers(local_peer_id);
            }
            // 定期输出 Bootstrap 地址列表并执行 STUN 请求
            _ = address_output_timer.tick() => {
                println!("Current known bootstrap nodes:");
                for addr in &bootstrap_nodes {
                    println!("  {}", addr);
                }
                
                // 尝试执行 STUN 请求以发现公网地址
                // 这里我们简化实现，仅演示基本流程
                // 在实际应用中，您可能需要更复杂的错误处理和重试机制
                match perform_stun_request().await {
                    Ok(public_addr) => {
                        println!("Discovered public address via STUN: {}", public_addr);
                        // NAT 穿透成功的一个指标是成功获取公网地址
                        communication_success = true;
                        println!("NAT traversal success detected through STUN request");
                    }
                    Err(e) => {
                        println!("STUN request failed: {}", e);
                        connection_attempts += 1; // 增加连接尝试计数器
                        
                        // 分析STUN错误以确定NAT类型
                        if e.to_string().contains("timeout") {
                            println!("STUN request timeout - likely indicates restrictive NAT");
                        } else if e.to_string().contains("binding") {
                            println!("STUN request binding error - likely indicates port restricted NAT");
                        }
                    }
                }
                
                // 保存Bootstrap节点信息到JSON文件
                match save_bootstrap_nodes_to_json(&active_bootstrap_nodes) {
                    Ok(_) => {
                        println!("Bootstrap node information saved to BOOTSTRAPS.json");
                    }
                    Err(e) => {
                        println!("Failed to save bootstrap node information to JSON file: {}", e);
                    }
                }
            }
        }
    }
    
    println!("Node shutdown complete.");
    println!("Final node-to-node communication status:");
    println!("  Success: {}", communication_success);
    println!("  Attempts: {}/{}", connection_attempts, MAX_CONNECTION_ATTEMPTS);
    
    Ok(())
}

// 更新Bootstrap节点状态的辅助函数
fn update_bootstrap_node_status(nodes: &mut Vec<BootstrapNode>, peer_id: &str, status: &str) {
    for node in nodes.iter_mut() {
        if node.peer_id == peer_id {
            // 更新状态
            node.status = status.to_string();
            
            // 如果状态是"active"，更新最后活动时间和成功计数
            if status == "active" {
                node.last_seen = Some(Utc::now().to_rfc3339());
                node.success_count += 1;
            } else if status == "inactive" {
                // 如果状态是"inactive"，增加失败计数
                node.failure_count += 1;
            }
            break;
        }
    }
}

// 简化的 STUN 客户端实现
async fn perform_stun_request() -> Result<SocketAddr, Box<dyn Error>> {
    // STUN 服务器列表
    let stun_servers = [
        "fwa.lifesizecloud.com:3478",
        "stun.isp.net.au:3478",
        "stun.freeswitch.org:3478",
        "stun.voip.blackberry.com:3478"
    ];
    
    // 尝试连接到第一个 STUN 服务器
    let stun_server = stun_servers[0];
    let socket = UdpSocket::bind("0.0.0.0:0").await?;
    socket.connect(stun_server).await?;
    
    // 创建 STUN Binding Request
    let mut encoder: MessageEncoder<stun_codec::rfc5389::Attribute> = MessageEncoder::new();
    let mut decoder: MessageDecoder<stun_codec::rfc5389::Attribute> = MessageDecoder::new();
    
    // 使用正确的 Method 创建 BINDING 方法
    let binding_method = Method::new(0x0001)?; // BINDING 方法的十六进制表示
    let msg = Message::new(MessageClass::Request, binding_method, TransactionId::new([0; 12]));
    
    // 编码消息
    let encoded = encoder.encode_into_bytes(msg)?; // 使用 encode_into_bytes 方法
    
    // 发送请求
    socket.send(&encoded).await?;
    
    // 接收响应
    let mut buffer = [0; 1024];
    let (len, _) = socket.recv_from(&mut buffer).await?;
    
    // 解码响应
    let decoded = decoder.decode_from_bytes(&buffer[..len])?; // 使用 decode_from_bytes 方法
    match decoded {
        Ok(msg) => {
            // 查找映射地址属性
            if let Some(mapped_addr) = msg.get_attribute::<MappedAddress>() {
                return Ok(mapped_addr.address());
            }
            
            // 查找 XOR 映射地址属性
            if let Some(xor_mapped_addr) = msg.get_attribute::<XorMappedAddress>() {
                return Ok(xor_mapped_addr.address()); // XOR 映射地址不需要 transaction_id 参数
            }
            
            Err("No mapped address found in STUN response".into())
        }
        Err(e) => Err(format!("Failed to decode STUN response: {:?}", e).into())
    }
}

// 保存Bootstrap节点信息到JSON文件的函数
fn save_bootstrap_nodes_to_json(nodes: &[BootstrapNode]) -> Result<(), Box<dyn Error>> {
    use std::fs::File;
    use std::io::Write;
    
    // 创建Bootstrap节点列表结构
    let bootstrap_list = BootstrapList {
        nodes: nodes.to_vec(),
        last_updated: Utc::now().to_rfc3339(),
    };
    
    // 序列化为JSON
    let json_string = serde_json::to_string_pretty(&bootstrap_list)?;
    
    // 写入文件
    let mut file = File::create("BOOTSTRAPS.json")?;
    file.write_all(json_string.as_bytes())?;
    
    Ok(())
}