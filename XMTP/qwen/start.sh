#!/bin/bash

echo "🤖 XMTP + Qwen AI 聊天机器人"
echo "================================"

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：请先安装 Node.js"
    exit 1
fi

# 检查.env文件是否存在
if [ ! -f ".env" ]; then
    echo "❌ 错误：请先创建 .env 文件并设置 QWEN_API_KEY"
    echo "示例："
    echo "QWEN_API_KEY=your_api_key_here"
    exit 1
fi

echo "✅ 环境检查通过"

# 提供选项
echo ""
echo "请选择操作："
echo "1) 启动机器人节点"
echo "2) 启动网页客户端服务器"
echo "3) 运行命令行客户端测试"
echo "4) 启动机器人并运行测试"
echo "5) 退出"

read -p "请输入选项 (1-5): " choice

case $choice in
    1)
        echo "🚀 启动机器人节点..."
        npm run bot
        ;;
    2)
        echo "🌐 启动网页客户端服务器..."
        echo "请在浏览器中访问: http://localhost:3000"
        npm run server
        ;;
    3)
        echo "💬 运行命令行客户端测试..."
        npm run client
        ;;
    4)
        echo "🤖 启动机器人节点..."
        npm run bot &
        BOT_PID=$!
        echo "机器人PID: $BOT_PID"
        sleep 3
        echo "💬 运行客户端测试..."
        npm run client
        kill $BOT_PID 2>/dev/null
        ;;
    5)
        echo "👋 再见！"
        exit 0
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac