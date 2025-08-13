@echo off
chcp 65001 >nul
echo 🤖 XMTP + Qwen AI 聊天机器人
echo ================================

REM 检查Node.js是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：请先安装 Node.js
    pause
    exit /b 1
)

REM 检查.env文件是否存在
if not exist ".env" (
    echo ❌ 错误：请先创建 .env 文件并设置 QWEN_API_KEY
    echo 示例：
    echo QWEN_API_KEY=your_api_key_here
    pause
    exit /b 1
)

echo ✅ 环境检查通过

REM 提供选项
echo.
echo 请选择操作：
echo 1) 启动机器人节点
echo 2) 启动网页客户端服务器
echo 3) 运行命令行客户端测试
echo 4) 启动机器人并运行测试
echo 5) 退出

set /p choice=请输入选项 (1-5): 

if "%choice%"=="1" (
    echo 🚀 启动机器人节点...
    npm run bot
) else if "%choice%"=="2" (
    echo 🌐 启动网页客户端服务器...
    echo 请在浏览器中访问: http://localhost:3000
    npm run server
) else if "%choice%"=="3" (
    echo 💬 运行命令行客户端测试...
    npm run client
) else if "%choice%"=="4" (
    echo 🤖 启动机器人节点...
    start "Bot Node" npm run bot
    timeout /t 5 /nobreak >nul
    echo 💬 运行客户端测试...
    npm run client
) else if "%choice%"=="5" (
    echo 👋 再见！
    exit /b 0
) else (
    echo ❌ 无效选项
    pause
    exit /b 1
)

pause