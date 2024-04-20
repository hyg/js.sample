const sm2 = require('sm-crypto').sm2

let keypair = sm2.generateKeyPairHex()

publicKey = keypair.publicKey // 公钥
privateKey = keypair.privateKey // 私钥

console.log("public key:"+publicKey);
console.log("private key:"+privateKey);

let verifyResult = sm2.verifyPublicKey(publicKey)
console.log("verify public key:"+verifyResult);

const cipherMode = 1 // 1 - C1C3C2，0 - C1C2C3，默认为1
const msgString = `
- task:PSMD  [整理合同和COM metadata](../../../draft/2024/04/20240420074500.md)
- task:PSMD  [COM metsdata → COM view](../../../draft/2024/04/20240420093000.md)
- task:js  [学习国密算法](../../../draft/2024/04/20240420140000.md)
- task:ego  [子任务时间汇总的伪码](../../../draft/2024/04/20240420143000.md)
- task:PSMD  [设计error、log、env、knowledge等新的数据结构，以及与termset、com、task关联。](../../../draft/2024/04/20240420160000.md)`;

let encryptData = sm2.doEncrypt(msgString, publicKey, cipherMode) // 加密结果
let decryptData = sm2.doDecrypt(encryptData, privateKey, cipherMode) // 解密结果

console.log("plain text:\n"+msgString);
console.log("encrypt text:\n"+encryptData);
console.log("decrypt text:\n"+decryptData);

let sigValueHex = sm2.doSignature(msgString, privateKey) // 签名
verifyResult = sm2.doVerifySignature(msgString, sigValueHex, publicKey) // 验签结果
console.log("signed hex:"+sigValueHex);
console.log("verify the sig: "+verifyResult);