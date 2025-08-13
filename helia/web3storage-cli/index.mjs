// index.mjs
import fs from 'fs/promises';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import KeyResolver from 'key-did-resolver';
import { DID } from 'dids';
import { Blob } from '@web3-storage/upload-client';

function generateEd25519Key() {
  return crypto.getRandomValues(new Uint8Array(32));
}

async function main() {
  console.log('正在创建您的 Web3.Storage 身份...\n');

  try {
    const key = generateEd25519Key();
    const provider = new Ed25519Provider(key);

    const did = new DID({
      provider,
      resolver: KeyResolver.getResolver()
    });
    await did.authenticate();
    const didString = did.id;

    console.log('✅ 身份创建成功！');
    console.log(`您的 DID: ${didString}`);
    console.log(`您的私钥 (hex): ${Buffer.from(key).toString('hex')}`);
    console.log('\n⚠️  请立即备份您的私钥！一旦丢失，身份将无法恢复！\n');

    // --- 直接使用 Uint8Array ---
    const testContent = 'Hello from Web3.Storage CLI! This is a test.';
    const contentBytes = new TextEncoder().encode(testContent);
    
    // 创建一个简单的文件对象
    const testFile = {
      name: 'test.txt',
      type: 'text/plain',
      size: contentBytes.byteLength,
      async arrayBuffer() {
        return contentBytes.buffer;
      }
    };
    // ---

    console.log('正在上传测试文件...');
    const cid = await Blob.add(did, testFile);
    console.log(`✅ 文件上传成功！`);
    console.log(`文件 CID: ${cid}`);

    console.log('\n正在验证文件内容...');
    const response = await fetch(`https://w3s.link/ipfs/${cid}`);
    if (response.ok) {
      const content = await response.text();
      console.log(`内容: ${content}`);
      console.log(content === testContent ? '✅ 内容验证通过！' : '❌ 内容验证失败！');
    } else {
      console.log('❌ 无法通过网关获取文件:', response.status);
    }

  } catch (err) {
    console.error('操作失败:', err);
    process.exit(1);
  }
}

if (typeof crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

main();