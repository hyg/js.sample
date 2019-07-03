var multihash = require('multihashes');
var Hashes = require('jshashes');


const buf = Buffer.from('0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33', 'hex');
const buf1 = GetHash("Every choice in computing has a tradeoff. This includes formats, algorithms, encodings, and so on. And even with a great deal of planning, decisions may lead to breaking changes down the road, or to solutions which are no longer optimal. Allowing systems to evolve and grow is important.",7);

const buf2 = Buffer.from(buf1, 'hex');

const encoded = multihash.encode(buf2, 'sha2-512');
console.log(encoded);
console.log(multihash.decode(encoded));
console.log(multihash.toHexString(encoded));

function GetHash(str,type){
	var MD5 = new Hashes.MD5;
	var SHA1 = new Hashes.SHA1;
	var SHA256 =  new Hashes.SHA256;
	var SHA512 = new Hashes.SHA512;
	var RMD160 = new Hashes.RMD160;
/*
* hashtype： 哈希算法类型
	* -1: default, SHA1 hex for now.
	* 1:MD5 hex
	* 2:MD5 b64
	* 3:SHA1 hex
	* 4:SHA1 b64
	* 5:SHA256 hex
	* 6:SHA256 b64
	* 7:SHA512 hex
	* 8:SHA512 b64
	* 9:RIPEMD-160 hex
	* 10:RIPEMD-160 b64
*/
	switch (type) {
		case 1:
		return MD5.hex(str);
		break;
		case 2:
		return MD5.b64(str);
		break;
		case 3:
		return SHA1.hex(str);
		break;
		case 4:
		return SHA1.b64(str);
		break;
		case 5:
		return SHA256.hex(str);
		break;
		case 6:
		return SHA256.b64(str);
		break;
		case 7:
		return SHA512.hex(str);
		break;
		case 8:
		return SHA512.b64(str);
		break;
		case 9:
		return RMD160.hex(str);
		break;
		case 10:
		return RMD160.b64(str);
		break;
		default:
		return SHA1.hex(str);
		break;
	}
}