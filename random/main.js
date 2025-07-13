
//方案 1：使用 CPU 的 TRNG 指令（RDSEED）
//依赖：Intel Broadwell / AMD Zen 及以上 CPU
//特点：直接从芯片热噪声获取物理熵，信息论意义上的真随机
const rng = require('rdrand-lite');
/* if (!rng.isRdSeedSupported()) {
  throw new Error('当前 CPU 不支持 RDSEED 指令');
} */
//console.log(rng.rdRand32())
//console.log(rng.rdRand64())
//console.log(rng.rdSeed32())
console.log(rng.rdSeed64())
//console.log(rng.normalizeUint32(rng.rdSeed32()))
//console.log(rng.normalizeUint64(rng.rdSeed64()))

// 方案 2：操作系统熵池（/dev/random）
//特点：依赖 OS 收集的物理噪声，可视为真随机（只要系统有活动）
const { randomInt } = require('crypto');
console.log(randomInt(0, 0xffffffff));// 32 位无符号整数

//方案 3：CSPRNG（/dev/urandom）
//特点：密码学安全伪随机，非真随机，但对于 99% 场景已足够安全
const { randomBytes } = require('crypto');
const bytes = randomBytes(4); // 4 字节随机
console.log(bytes.readUInt32BE(0));

// trng
const trng = require("trng");
var length = 32;

trng.generate(length, function(randomHexString) {
  console.log("Random hex string:", randomHexString);
});