const sm2 = require('sm-crypto').sm2
const sm3 = require('sm-crypto').sm3
const sm4 = require('sm-crypto').sm4

var test2 = false;
var test3 = false;
var test4 = true;

if (test2) {
    let keypair = sm2.generateKeyPairHex()

    publicKey = keypair.publicKey // 公钥
    privateKey = keypair.privateKey // 私钥

    console.log("public key:" + publicKey);
    console.log("private key:" + privateKey);

    let verifyResult = sm2.verifyPublicKey(publicKey)
    console.log("verify public key:" + verifyResult);

    const cipherMode = 1 // 1 - C1C3C2，0 - C1C2C3，默认为1
    const msgString = `
    - task:PSMD  [整理合同和COM metadata](../../../draft/2024/04/20240420074500.md)
    - task:PSMD  [COM metsdata → COM view](../../../draft/2024/04/20240420093000.md)
    - task:js  [学习国密算法](../../../draft/2024/04/20240420140000.md)
    - task:ego  [子任务时间汇总的伪码](../../../draft/2024/04/20240420143000.md)
    - task:PSMD  [设计error、log、env、knowledge等新的数据结构，以及与termset、com、task关联。](../../../draft/2024/04/20240420160000.md)`;

    let encryptData = sm2.doEncrypt(msgString, publicKey, cipherMode) // 加密结果
    let decryptData = sm2.doDecrypt(encryptData, privateKey, cipherMode) // 解密结果

    console.log("plain text:\n" + msgString);
    console.log("encrypt text:\n" + encryptData);
    console.log("decrypt text:\n" + decryptData);

    let sigValueHex = sm2.doSignature(msgString, privateKey) // 签名
    verifyResult = sm2.doVerifySignature(msgString, sigValueHex, publicKey) // 验签结果
    console.log("signed hex:" + sigValueHex);
    console.log("verify the sig: " + verifyResult);
}

if (test3) {
    console.log(sm3('test'));
    console.log(sm3('1'));
    console.log(sm3('2'));
    console.log(sm3('3'));
    console.log(sm3('4'));
}

if (test4) {
    const msg = `
    - task:PSMD  [整理合同和COM metadata](../../../draft/2024/04/20240420074500.md)
    - task:PSMD  [COM metsdata → COM view](../../../draft/2024/04/20240420093000.md)
    - task:js  [学习国密算法](../../../draft/2024/04/20240420140000.md)
    - task:ego  [子任务时间汇总的伪码](../../../draft/2024/04/20240420143000.md)
    - task:PSMD  [设计error、log、env、knowledge等新的数据结构，以及与termset、com、task关联。](../../../draft/2024/04/20240420160000.md)`;
    const key = '0123456789abcdeffedcba9876543210' // 可以为 16 进制串或字节数组，要求为 128 比特

    let encryptData1 = sm4.encrypt(msg, key) // 加密，默认输出 16 进制字符串，默认使用 pkcs#7 填充（传 pkcs#5 也会走 pkcs#7 填充）
    console.log(encryptData1);
    let encryptData2 = sm4.encrypt(msg, key, { padding: 'none' }) // 加密，不使用 padding
    console.log(encryptData2);
    let encryptData3 = sm4.encrypt(msg, key, { padding: 'none', output: 'array' }) // 加密，不使用 padding，输出为字节数组
    console.log(encryptData3);
    let encryptData4 = sm4.encrypt(msg, key, { mode: 'cbc', iv: 'fedcba98765432100123456789abcdef' }) // 加密，cbc 模式
    console.log(encryptData4);

    let decryptData1 = sm4.decrypt(encryptData1, key) // 解密，默认输出 utf8 字符串，默认使用 pkcs#7 填充（传 pkcs#5 也会走 pkcs#7 填充）
    console.log(decryptData1);
    let decryptData2 = sm4.decrypt(encryptData2, key, { padding: 'none' }) // 解密，不使用 padding
    console.log(decryptData2);
    let decryptData3 = sm4.decrypt(encryptData3, key, { padding: 'none', output: 'array' }) // 解密，不使用 padding，输出为字节数组
    console.log(decryptData3);
    let decryptData4 = sm4.decrypt(encryptData4, key, { mode: 'cbc', iv: 'fedcba98765432100123456789abcdef' }) // 解密，cbc 模式
    console.log(decryptData4);
}