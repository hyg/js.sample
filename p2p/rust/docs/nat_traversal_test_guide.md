# NAT穿透测试指南（更新版）

## 测试准备

1. 确保两台位于不同NAT后的机器可以访问相同的网络
2. 在两台机器上都克隆此项目
3. 确保两台机器都能访问互联网和STUN服务器

## 测试步骤

### 1. 在第一台机器上启动响应者节点

```bash
# 在第一台机器上运行
cargo run --bin nat_traversal_test
```

### 2. 在第二台机器上启动发起者节点

```bash
# 在第二台机器上运行
cargo run --bin nat_traversal_test initiator [共享参数]
```

共享参数可以是会议室名称或公钥等标识符，默认为"default_room"。

## 测试结果

测试程序会自动运行，最多持续5分钟。测试结果会通过退出码显示：

- 退出码 0: NAT穿透成功（至少与一个节点建立连接）
- 退出码 1: NAT穿透失败（所有节点连接尝试均失败）
- 退出码 2: 测试超时（超过5分钟限制）

测试过程中会输出详细的日志信息，包括：
- 节点发现过程
- STUN请求结果
- 连接尝试详情
- 最终测试结果

## 测试报告

测试结束后会生成详细的测试报告文件：
- `NAT_TRAVERSAL_TEST_REPORT.txt`: 包含测试结果、连接尝试详情和失败统计

## 自动化测试

可以使用以下脚本自动化测试过程：

```bash
#!/bin/bash
# nat_traversal_test.sh

echo "Starting NAT traversal test..."

# 启动响应者节点（后台运行）
cargo run --bin nat_traversal_test &
RESPONDER_PID=$!

# 等待几秒钟让响应者节点启动
sleep 5

# 启动发起者节点
cargo run --bin nat_traversal_test initiator test_room

# 获取发起者节点的退出码
INITIATOR_EXIT_CODE=$?

# 终止响应者节点
kill $RESPONDER_PID

# 根据发起者节点的退出码判断测试结果
if [ $INITIATOR_EXIT_CODE -eq 0 ]; then
    echo "NAT TRAVERSAL TEST PASSED"
    exit 0
elif [ $INITIATOR_EXIT_CODE -eq 1 ]; then
    echo "NAT TRAVERSAL TEST FAILED"
    exit 1
elif [ $INITIATOR_EXIT_CODE -eq 2 ]; then
    echo "NAT TRAVERSAL TEST TIMEOUT"
    exit 2
else
    echo "NAT TRAVERSAL TEST UNKNOWN ERROR"
    exit 3
fi
```

## 手动测试

如果需要手动测试，可以分别在两台机器上运行：

**机器A（响应者）:**
```bash
cargo run --bin nat_traversal_test
```

**机器B（发起者）:**
```bash
cargo run --bin nat_traversal_test initiator test_room
```

观察机器B的输出结果和退出码来判断测试是否成功。