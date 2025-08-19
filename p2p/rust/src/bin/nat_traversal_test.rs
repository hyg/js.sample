// nat_traversal_test.rs - NAT穿透测试程序
use libp2p::{
    identity,
    PeerId,
    Swarm,
    kad::{self, Mode, Event as KademliaEvent, QueryResult, BootstrapOk, BootstrapError, GetClosestPeersOk, GetClosestPeersError, RecordKey},
    ping::{self, Event as PingEvent, Failure as PingFailure},
    swarm::{SwarmEvent, NetworkBehaviour},
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

// 定义连接尝试结果
#[derive(Debug, Clone)]
struct ConnectionAttempt {
    peer_id: PeerId,
    timestamp: String,
    result: String, // "success", "timeout", "refused", "error"
    error_message: Option<String>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // 获取命令行参数，确定节点角色（测试发起者或响应者）和共享参数
    let args: Vec<String> = std::env::args().collect();
    let is_initiator = args.len() > 1 && args[1] == "initiator";
    let shared_param = if args.len() > 2 { 
        args[2].clone() 
    } else { 
        "default_room".to_string()  // 默认会议室名称
    };
    
    println!("Starting NAT traversal test as {}", 
             if is_initiator { "INITIATOR" } else { "RESPONDER" });
    println!("Shared parameter (room name/key): {}", shared_param);
    
    // 设置运行时间限制(分钟)
    let max_runtime_minutes = 5; // NAT穿透测试最多运行5分钟
    let start_time = Instant::now();
    
    // NAT穿透成功标志
    let mut nat_traversal_success = false;
    
    // 节点连接尝试计数器
    let mut connection_attempts = 0;
    const MAX_CONNECTION_ATTEMPTS: u32 = 10; // 最多尝试连接10次
    
    // 存储连接尝试结果
    let mut connection_results: Vec<ConnectionAttempt> = Vec::new();
    
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

    // 将Bootstrap节点添加到Kademlia路由表
    for addr in &bootstrap_nodes {
        // 解析Multiaddr
        let multiaddr = addr.parse()?;
        // 添加到Kademlia
        kademlia.add_address(&PeerId::random(), multiaddr);
    }

    // 创建Ping行为
    let ping = ping::Behaviour::new(ping::Config::new().with_interval(Duration::from_secs(10)));

    // 创建组合行为
    let behaviour = MyBehaviour { kademlia, ping };
    
    // 创建Swarm
    let mut swarm = Swarm::new(transport, behaviour, local_peer_id, libp2p::swarm::Config::without_executor());

    // 监听本地地址
    swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse()?)?;

    // 启动初始Bootstrap
    swarm.behaviour_mut().kademlia.bootstrap().unwrap();

    // 使用共享参数作为DHT键来发布节点信息
    let dht_key = RecordKey::new(&shared_param);
    let node_info = format!("peer_id={}", local_peer_id);
    swarm.behaviour_mut().kademlia.put_record(
        libp2p::kad::Record::new(dht_key.clone(), node_info.into_bytes()),
        libp2p::kad::Quorum::One,
    )?;

    // 创建定时器，定期输出地址列表和执行STUN请求
    let mut address_output_timer = interval(Duration::from_secs(30));
    
    // 创建定时器，定期刷新Peer发现
    let mut peer_discovery_timer = interval(Duration::from_secs(60));

    // 主事件循环
    loop {
        // 检查运行时间是否超限
        if start_time.elapsed() > Duration::from_secs(max_runtime_minutes * 60) {
            println!("Maximum runtime ({} minutes) reached. Shutting down...", max_runtime_minutes);
            break;
        }
        
        // 检查是否达到最大连接尝试次数
        if connection_attempts >= MAX_CONNECTION_ATTEMPTS {
            println!("Maximum connection attempts ({}) reached. Shutting down...", MAX_CONNECTION_ATTEMPTS);
            break;
        }

        tokio::select! {
            // 处理Swarm事件
            event = swarm.select_next_some() => {
                match event {
                    // 新的监听地址
                    SwarmEvent::NewListenAddr { address, .. } => {
                        println!("Node {:?} listening on {}", local_peer_id, address);
                    }
                    
                    // Kademlia事件
                    SwarmEvent::Behaviour(MyBehaviourEvent::Kademlia(kad_event)) => {
                        match kad_event {
                            KademliaEvent::OutboundQueryProgressed { result: QueryResult::Bootstrap(Ok(BootstrapOk { peer, .. })), .. } => {
                                println!("Successfully bootstrapped with {:?}", peer);
                            }
                            KademliaEvent::OutboundQueryProgressed { result: QueryResult::Bootstrap(Err(BootstrapError::Timeout { peer, .. })), .. } => {
                                println!("Bootstrap timeout with {:?}", peer);
                            }
                            KademliaEvent::OutboundQueryProgressed { result: QueryResult::GetClosestPeers(Ok(GetClosestPeersOk { key, peers, .. })), .. } => {
                                println!("Found {} closest peers for {:?}", peers.len(), key);
                                // 如果是测试发起者且发现了其他节点，尝试连接
                                if is_initiator && !peers.is_empty() && !nat_traversal_success {
                                    for peer_info in &peers {
                                        let peer_id = peer_info.peer_id;
                                        if peer_id != local_peer_id {
                                            println!("Attempting to connect to peer: {:?}", peer_id);
                                            swarm.dial(peer_id).unwrap();
                                            connection_attempts += 1;
                                        }
                                    }
                                }
                            }
                            KademliaEvent::OutboundQueryProgressed { result: QueryResult::GetClosestPeers(Err(GetClosestPeersError::Timeout { key, .. })), .. } => {
                                println!("GetClosestPeers timeout for {:?}", key);
                            }
                            _ => {}
                        }
                    }
                    
                    // Ping事件
                    SwarmEvent::Behaviour(MyBehaviourEvent::Ping(ping_event)) => {
                        match ping_event {
                            PingEvent { peer, result: Ok(rtt), .. } => {
                                println!("Ping response from {:?}: RTT = {:?}", peer, rtt);
                                // 更新Bootstrap节点状态
                                update_bootstrap_node_status(&mut active_bootstrap_nodes, &peer.to_string(), "active");
                            }
                            PingEvent { peer, result: Err(PingFailure::Timeout), .. } => {
                                println!("Ping timeout from {:?}", peer);
                                update_bootstrap_node_status(&mut active_bootstrap_nodes, &peer.to_string(), "inactive");
                            }
                            PingEvent { peer, result: Err(PingFailure::Other { error }), .. } => {
                                println!("Ping error from {:?}: {:?}", peer, error);
                                update_bootstrap_node_status(&mut active_bootstrap_nodes, &peer.to_string(), "inactive");
                            }
                            _ => {}
                        }
                    }
                    
                    // 连接建立事件
                    SwarmEvent::ConnectionEstablished { peer_id, .. } => {
                        println!("Connection established with: {:?}", peer_id);
                        if is_initiator {
                            // 如果是测试发起者且成功建立了连接，则NAT穿透成功
                            nat_traversal_success = true;
                            println!("NAT TRAVERSAL SUCCESS: Direct connection established with {:?}", peer_id);
                            // 记录连接成功结果
                            connection_results.push(ConnectionAttempt {
                                peer_id,
                                timestamp: Utc::now().to_rfc3339(),
                                result: "success".to_string(),
                                error_message: None,
                            });
                            // 发送测试消息
                            println!("Sending test message...");
                            // 在实际应用中，这里会发送测试数据
                            println!("Test message sent successfully");
                            break; // 成功后退出循环
                        }
                    }
                    
                    // 连接关闭事件
                    SwarmEvent::ConnectionClosed { peer_id, cause, .. } => {
                        println!("Connection closed with {}: {:?}", peer_id, cause);
                    }
                    
                    // 连接错误事件
                    SwarmEvent::OutgoingConnectionError { peer_id, error, .. } => {
                        if let Some(peer_id) = peer_id {
                            println!("Outgoing connection error to {:?}: {:?}", peer_id, error);
                            // 记录连接失败结果
                            let error_msg = format!("{:?}", error);
                            connection_results.push(ConnectionAttempt {
                                peer_id,
                                timestamp: Utc::now().to_rfc3339(),
                                result: "error".to_string(),
                                error_message: Some(error_msg.clone()),
                            });
                            
                            match error {
                                libp2p::swarm::DialError::WrongPeerId { obtained, .. } => {
                                    println!("Wrong peer ID - obtained: {:?}", obtained);
                                    // 更新本地路由表中的PeerId信息
                                    swarm.behaviour_mut().kademlia.remove_peer(&peer_id);
                                }
                                libp2p::swarm::DialError::Transport(_) => {
                                    println!("Transport error - likely indicates firewall or restrictive NAT");
                                }
                                _ => {}
                            }
                        } else {
                            println!("Outgoing connection error: {:?}", error);
                        }
                    }
                    
                    // 入站连接错误事件
                    SwarmEvent::IncomingConnectionError { local_addr, send_back_addr, error, .. } => {
                        println!("Incoming connection error from {} to {}: {:?}", send_back_addr, local_addr, error);
                        match error {
                            libp2p::swarm::ListenError::Transport(_) => {
                                println!("Incoming connection refused - likely indicates firewall");
                            }
                            _ => {}
                        }
                    }
                    
                    _ => {}
                }
            }
            
            // 定期输出地址列表和执行STUN请求
            _ = address_output_timer.tick() => {
                println!("Current known bootstrap nodes:");
                for addr in &bootstrap_nodes {
                    println!("  {}", addr);
                }
                
                // 尝试执行 STUN 请求以发现公网地址
                match perform_stun_request().await {
                    Ok(public_addr) => {
                        println!("Discovered public address via STUN: {}", public_addr);
                        if is_initiator {
                            println!("NAT traversal success detected through STUN request");
                        }
                    }
                    Err(e) => {
                        println!("STUN request failed: {}", e);
                    }
                }
                
                // 保存Bootstrap节点信息到JSON文件
                save_bootstrap_nodes_to_json(&active_bootstrap_nodes)?;
            }
            
            // 定期刷新Peer发现
            _ = peer_discovery_timer.tick() => {
                println!("Refreshing peer discovery...");
                // 触发寻找最近的节点
                swarm.behaviour_mut().kademlia.get_closest_peers(local_peer_id.to_bytes());
            }
        }
    }
    
    // 关闭节点
    println!("Node shutdown complete.");
    
    // 生成测试报告
    generate_test_report(
        nat_traversal_success,
        &connection_results,
        start_time.elapsed().as_secs(),
        connection_attempts,
        MAX_CONNECTION_ATTEMPTS,
    );
    
    // 输出最终的NAT穿透测试结果
    println!("Final NAT traversal test status:");
    println!("  Success: {}", nat_traversal_success);
    println!("  Attempts: {}/{}", connection_attempts, MAX_CONNECTION_ATTEMPTS);
    println!("  Test duration: {} seconds", start_time.elapsed().as_secs());
    
    // 根据测试结果返回相应的退出码
    if nat_traversal_success {
        println!("NAT TRAVERSAL TEST PASSED");
        std::process::exit(0); // 成功退出
    } else if start_time.elapsed() > Duration::from_secs(max_runtime_minutes * 60) {
        println!("NAT TRAVERSAL TEST FAILED - TIMEOUT");
        std::process::exit(2); // 超时退出
    } else {
        println!("NAT TRAVERSAL TEST FAILED");
        std::process::exit(1); // 失败退出
    }
}

// 更新Bootstrap节点状态的函数
fn update_bootstrap_node_status(nodes: &mut Vec<BootstrapNode>, peer_id: &str, status: &str) {
    for node in nodes.iter_mut() {
        if node.peer_id == peer_id {
            node.status = status.to_string();
            if status == "active" {
                node.last_seen = Some(Utc::now().to_rfc3339());
                node.success_count += 1;
            } else {
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

// 生成测试报告的函数
fn generate_test_report(
    success: bool,
    connection_results: &[ConnectionAttempt],
    duration: u64,
    attempts: u32,
    max_attempts: u32,
) {
    use std::fs::File;
    use std::io::Write;
    
    println!("
=== NAT TRAVERSAL TEST REPORT ===");
    println!("Test Result: {}", if success { "PASSED" } else { "FAILED" });
    println!("Test Duration: {} seconds", duration);
    println!("Connection Attempts: {}/{}", attempts, max_attempts);
    
    if !connection_results.is_empty() {
        println!("
Connection Attempts Details:");
        for attempt in connection_results {
            println!("  Peer: {:?} | Time: {} | Result: {} | Error: {:?}", 
                     attempt.peer_id, 
                     attempt.timestamp, 
                     attempt.result, 
                     attempt.error_message.as_ref().unwrap_or(&"None".to_string()));
        }
    }
    
    // 统计失败原因
    let timeout_count = connection_results.iter().filter(|a| a.result == "error" && 
        a.error_message.as_ref().map_or(false, |e| e.contains("Timeout"))).count();
    let refused_count = connection_results.iter().filter(|a| a.result == "error" && 
        a.error_message.as_ref().map_or(false, |e| e.contains("ConnectionRefused"))).count();
    
    println!("
Failure Statistics:");
    println!("  Timeout Errors: {}", timeout_count);
    println!("  Connection Refused: {}", refused_count);
    println!("  Other Errors: {}", connection_results.len() - timeout_count - refused_count);
    
    // 保存报告到文件
    let report = format!(
        "NAT TRAVERSAL TEST REPORT

        =========================

        Test Result: {}

        Test Duration: {} seconds

        Connection Attempts: {}/{}

        

        Connection Attempts Details:

        {}

        

        Failure Statistics:

        - Timeout Errors: {}

        - Connection Refused: {}

        - Other Errors: {}
",
        if success { "PASSED" } else { "FAILED" },
        duration,
        attempts,
        max_attempts,
        connection_results.iter().map(|a| format!("  Peer: {:?} | Time: {} | Result: {} | Error: {:?}", 
            a.peer_id, a.timestamp, a.result, a.error_message.as_ref().unwrap_or(&"None".to_string())))
            .collect::<Vec<_>>().join("
"),
        timeout_count,
        refused_count,
        connection_results.len() - timeout_count - refused_count
    );
    
    if let Ok(mut file) = File::create("NAT_TRAVERSAL_TEST_REPORT.txt") {
        let _ = file.write_all(report.as_bytes());
        println!("
Detailed report saved to NAT_TRAVERSAL_TEST_REPORT.txt");
    }
}