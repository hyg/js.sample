// sync.js
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const TAB_URL   = process.env.TAB_URL.replace(/\/+$/, '');  // 去掉末尾斜杠
const TAB_USER  = process.env.TAB_USER;
const TAB_PASS  = process.env.TAB_PASS;
const LOCAL_DIR = path.resolve(process.env.LOCAL_DIR || './notes');
const STATE_FILE = path.join(process.cwd(), '.state.json');

// Basic Auth 头
const auth = { username: TAB_USER, password: TAB_PASS };

// 用于缓存本地最后修改时间，减少无意义的上传
let state = {};
if (fs.existsSync(STATE_FILE)) {
  try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}
}

function saveState() {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// 上传文件
async function upload(localPath) {
  const remotePath = path.relative(LOCAL_DIR, localPath).split(path.sep).join('/');
  const url = `${TAB_URL}/${encodeURIComponent(remotePath)}`;
  const data = fs.createReadStream(localPath);
  await axios.put(url, data, { auth, headers: { 'Content-Type': 'text/markdown' } });
  console.log('↑', remotePath);
  state[localPath] = fs.statSync(localPath).mtimeMs;
  saveState();
}

// 删除文件
async function remove(localPath) {
  const remotePath = path.relative(LOCAL_DIR, localPath).split(path.sep).join('/');
  const url = `${TAB_URL}/${encodeURIComponent(remotePath)}`;
  await axios.delete(url, { auth });
  console.log('✗', remotePath);
  delete state[localPath];
  saveState();
}

// 首次全量同步
async function initialSync() {
  const files = [];
  function scan(dir) {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) scan(p);
      else files.push(p);
    }
  }
  scan(LOCAL_DIR);
  for (const f of files) {
    const mtime = fs.statSync(f).mtimeMs;
    if (state[f] !== mtime) await upload(f);
  }
}

// 启动监听
async function main() {
  await initialSync();
  console.log('🚀 监控开始：', LOCAL_DIR);
  const watcher = chokidar.watch(LOCAL_DIR, {
    ignored: /(^|[\/\\])\../, // 忽略隐藏文件
    persistent: true,
  });
  watcher
    .on('add', upload)
    .on('change', upload)
    .on('unlink', remove);
}

main().catch(console.error);