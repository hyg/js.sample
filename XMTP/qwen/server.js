// 简单HTTP服务器，用于提供网页客户端和XMTP SDK
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

async function serveFile(filePath, response) {
  try {
    const data = await fs.promises.readFile(filePath);
    const mimeType = getMimeType(filePath);
    
    response.writeHead(200, {
      'Content-Type': mimeType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    
    response.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      serve404(response);
    } else {
      serve500(response, error);
    }
  }
}

function serve404(response) {
  response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end('<h1>404 - 页面未找到</h1><p><a href="/">返回首页</a></p>');
}

function serve500(response, error) {
  console.error('服务器错误:', error);
  response.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end('<h1>500 - 服务器内部错误</h1>');
}

const server = http.createServer(async (request, response) => {
  console.log(`${new Date().toISOString()} - ${request.method} ${request.url}`);
  
  // 处理CORS预检请求
  if (request.method === 'OPTIONS') {
    response.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    response.end();
    return;
  }
  
  let filePath = request.url === '/' ? './web-client.html' : '.' + request.url;
  
  // 确保文件路径在项目目录内
  filePath = path.normalize(filePath);
  if (!filePath.startsWith('.' + path.sep)) {
    serve404(response);
    return;
  }
  
  await serveFile(filePath, response);
});

server.listen(PORT, () => {
  console.log(`\n🚀 HTTP服务器已启动！`);
  console.log(`📱 网页客户端: http://localhost:${PORT}`);
  console.log(`🤖 请确保机器人节点正在运行: node bot-node.js`);
  console.log(`\n按 Ctrl+C 停止服务器\n`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，请尝试其他端口`);
  } else {
    console.error('服务器错误:', error);
  }
});