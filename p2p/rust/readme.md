使用rust开发一个节点软件：
1. 每个节点运行在不同的局域网内，局域网出口安装有NAT；
2. 节点软件使用dht协议发布自己的公网地址，获得其它节点的公网地址，并进行通信；
3. 只开发节点软件，不开发任何服务器端的代码。节点在建立连接时可以借助已经存在的第三方服务器，要求在中国大陆可以使用，同一方法有多个互相替换的服务器可选择；
4. 通信时不能使用服务器，把通信时间、内容、大致内容长度、各方网址都控制在最小知情范围内。

如果需要使用stun服务器，增加：
{ urls: 'stun:fwa.lifesizecloud.com:3478' },
{ urls: 'stun:stun.isp.net.au:3478' },
{ urls: 'stun:stun.freeswitch.org:3478' },
{ urls: 'stun:stun.voip.blackberry.com:3478' }

如果需要使用dht的BOOTSTRAPS，增加：
    { host: '34.197.35.250', port: 6880 },
    { host: '72.46.58.63', port: 51413 },
    { host: '46.53.251.68', port: 16970 },
    { host: '191.95.16.229', port: 55998 },
    { host: '79.173.94.111', port: 1438 },
    { host: '45.233.86.50', port: 61995 },
    { host: '178.162.174.28', port: 28013 },
    { host: '178.162.174.240', port: 28006 },
    { host: '72.21.17.101', port: 22643 },
    { host: '31.181.42.46', port: 22566 },
    { host: '67.213.106.46', port: 61956 },
    { host: '201.131.172.249', port: 53567 },
    { host: '185.203.152.184', port: 2003 },
    { host: '68.146.23.207', port: 42107 },
    { host: '51.195.222.183', port: 8653 },
    { host: '85.17.170.48', port: 28005 },
    { host: '87.98.162.88', port: 6881 },
    { host: '185.145.245.121', port: 8656 },
    { host: '52.201.45.189', port: 6880 }
以及BOOTSTRAPS.json的内容。

在停止运行时，把当前可用的peer信息使用json格式保存为文件BOOTSTRAPS.json

## NAT穿透测试

项目实现了NAT穿透功能，使用STUN协议来发现节点的公网地址，并通过DHT实现节点间直接通信。

详细测试方案请参见[docs/nat_traversal_test_plan.md](docs/nat_traversal_test_plan.md)。
详细测试指南请参见[docs/nat_traversal_test_guide.md](docs/nat_traversal_test_guide.md)。
详细测试报告请参见[docs/nat_traversal_test_report.md](docs/nat_traversal_test_report.md)。

### 运行NAT穿透测试

```bash
# 在响应者节点上运行
cargo run --bin nat_traversal_test

# 在发起者节点上运行
cargo run --bin nat_traversal_test initiator
```

测试程序会自动运行，最多持续5分钟。测试结果会通过退出码显示：
- 退出码 0: NAT穿透成功
- 退出码 1: NAT穿透失败

## 性能基准测试

项目包含一个性能基准测试二进制文件，可以用来评估节点软件的性能：

```bash
# 运行性能基准测试
cargo run --bin performance_benchmark

# 运行测试
cargo test
```

性能基准测试会生成以下文件：
- BOOTSTRAPS.json: 包含发现的Bootstrap节点信息
- PERFORMANCE_BENCHMARK_RESULTS.json: 包含性能测试结果