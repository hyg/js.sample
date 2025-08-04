import { LlamaModel } from 'node-llama-cpp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 获取当前文件的目录路径
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelPath = path.join(__dirname, 'models', 'phi-3-mini-4k-instruct-q4.gguf');

console.log('模型路径:', modelPath);
console.log('文件存在:', fs.existsSync(modelPath)); // 使用 ES 模块语法

try {
  const model = new LlamaModel({
    modelPath,
    gpuLayers: 0, // 强制使用CPU
    verbose: true // 开启详细日志
  });
  console.log('模型加载成功');
} catch (error) {
  console.error('模型加载失败:', error);
}