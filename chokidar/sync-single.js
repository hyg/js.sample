// sync-single.js
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const TAB_URL   = process.env.TAB_URL.replace(/\/+$/, '');
const TAB_USER  = process.env.TAB_USER;
const TAB_PASS  = process.env.TAB_PASS;
const LOCAL_FILE = path.resolve(process.env.LOCAL_FILE);

const REMOTE_NAME = path.basename(LOCAL_FILE);   // 上传到云端后的文件名
const STATE_FILE  = path.join(process.cwd(), '.state-single.json');

let lastMtime = fs.existsSync(STATE_FILE)
  ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')).mtime || 0
  : 0;

function saveState(mtime) {
  fs.writeFileSync(STATE_FILE, JSON.stringify({ mtime }, null, 2));
}

// 上传
async function upload() {
  const url = `${TAB_URL}/${encodeURIComponent(REMOTE_NAME)}`;
  const data = fs.createReadStream(LOCAL_FILE);
  await axios.put(url, data, {
    auth: { username: TAB_USER, password: TAB_PASS },
    headers: { 'Content-Type': 'text/markdown' },
  });
  const mtime = fs.statSync(LOCAL_FILE).mtimeMs;
  saveState(mtime);
  console.log('↑', REMOTE_NAME, new Date().toLocaleTimeString());
}

// 删除
async function remove() {
  const url = `${TAB_URL}/${encodeURIComponent(REMOTE_NAME)}`;
  await axios.delete(url, { auth: { username: TAB_USER, password: TAB_PASS } });
  fs.unlinkSync(STATE_FILE);
  console.log('✗', REMOTE_NAME, new Date().toLocaleTimeString());
}

// 首次检测：如果本地文件比缓存新，则上传一次
async function initial() {
  if (!fs.existsSync(LOCAL_FILE)) return;
  const mtime = fs.statSync(LOCAL_FILE).mtimeMs;
  if (mtime !== lastMtime) await upload();
}

// 只监控这一份文件
async function main() {
  await initial();
  console.log('🚀 监控单个文件：', LOCAL_FILE);
  chokidar.watch(LOCAL_FILE, { persistent: true })
    .on('change', upload)
    .on('unlink', remove);
}

main().catch(console.error);