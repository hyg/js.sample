
// openpgp keypair utility
// save to server, use in page.
// place these BEFOEE this js src
// <script src="js-yaml.min.js"></script>
// <script src="hashes.min.js"></script>
// <script src="openpgp.min.js"></script>
// <script src="FileSaver.min.js"></script>

var keyinfo = new Object();

function createandsave(url){
	//var openpgp = window.openpgp;
	var name = prompt('请输入姓名:');
	var id = prompt('请输入ID:');
	var email = prompt('请输入Email:');
	var passphrase = prompt('请输入口令:');
	var salt = randomString(128);

	var SHA512 = new Hashes.SHA512;
	var truepassphrase = SHA512.hex(salt + passphrase) ;
	
	var publicKey,privateKey;
	
	var UserId = name + " (" + id + ") <" + email + ">" ;
	var opt = {numBits: 512, userIds: UserId, passphrase: truepassphrase};
	
	keyinfo.name = name;
	keyinfo.id = id;	
	keyinfo.email = email;
	keyinfo.salt = salt;
	
	openpgp.generateKey(opt).then(function(key) {
		keyinfo.pubkey = key.publicKeyArmored;
		keyinfo.seckey = key.privateKeyArmored;
		
		return postkey(keyinfo,url);
	});
}

function importkeyV0_1(pubkey,seckey,url){
	var name = prompt('请输入姓名:');
	var id = prompt('请输入ID:');
	var email = prompt('请输入Email:');
	var passphrase = prompt('请输入旧口令:');
	
	var newsalt = randomString(128);
	var SHA512 = new Hashes.SHA512;
	keyinfo.name = name;
	keyinfo.id = id;	
	keyinfo.email = email;
	keyinfo.salt = newsalt;
	
	var publicKey = openpgp.key.readArmored(pubkey).keys[0];
	keyinfo.pubkey = publicKey.armor();
	
	var privateKey = openpgp.key.readArmored(seckey).keys[0];
	var success = privateKey.decrypt(passphrase);

	if(!success){
		//alert("私钥解密失败。");
		throw new Error('Decrypting key with passphrase failed!');
	}

	var newpassphrase = prompt('准备更换密钥口令，请输入新口令');
	var newtruepassphrase = SHA512.hex(newsalt + newpassphrase) ;
	privateKey.encrypt(newtruepassphrase);
	keyinfo.seckey = privateKey.armor();
	
	return postkey(keyinfo,url);
}

function postkey(keyinfo,url){
	var body = jsyaml.safeDump(keyinfo);
	
	var xmlhttp=getajaxHttp();

	xmlhttp.open("post",url,false);
	xmlhttp.send(body);
	
	return xmlhttp;
}

function getkey(url){
	var email = prompt('请输入email:');
	var xmlhttp=getajaxHttp();

	var path = url + email + ".keyinfo" ;
	xmlhttp.open("get",path,false);
	xmlhttp.send(email);
	
	return xmlhttp;
}

function changepassphrase(url,callback){
	var SHA512 = new Hashes.SHA512;
	
	var xmlhttp = getkey(url);
	if(xmlhttp.status == 200){
		keyinfo = jsyaml.safeLoad(xmlhttp.responseText);
	}else{
		return;
	}

	var passphrase = prompt('请输入旧口令:');
	// read the old salt from keyinfo
	var salt = keyinfo.salt;
	// generate a new salt
	var newsalt = randomString(128);
	
	var privateKey = openpgp.key.readArmored(keyinfo.seckey).keys[0];
	var truepassphrase = SHA512.hex(salt + passphrase) ;
	
	// decrypt the private key by old passphrase
	var success = privateKey.decrypt(truepassphrase);

	if(!success){
		//alert("私钥解密失败。");
		throw new Error('Decrypting key with passphrase failed!');
	}
	// input a new passphrase
	var newpassphrase = prompt('准备更换密钥口令，请输入新口令');
	if (passphrase === newpassphrase || (!passphrase && !newpassphrase)) {
		throw new Error('New and old passphrase are the same!');
	}

	var newtruepassphrase = SHA512.hex(newsalt + newpassphrase) ;
	
	// encrypt private key by new passphrase
	privateKey.encrypt(newtruepassphrase);
	// update keyinfo
	keyinfo.salt = newsalt;
	keyinfo.seckey = privateKey.armor();
	
	var body = jsyaml.safeDump(keyinfo);
	
	var success = privateKey.decrypt(newtruepassphrase);
	if(!success){
		throw new Error('Decrypting key with passphrase failed!');
	}

	// sign the keyinfo yaml
	options = {
		data: body,     // parse encrypted bytes
		privateKeys: privateKey,                 // for signing
		armor: true,
	};
	openpgp.sign(options).then(function (pgpMessage) {
		var ajax=getajaxHttp();

		ajax.open("put",url,false);
		ajax.send(pgpMessage.data);

		callback(ajax);
	});
}
			
function randomString(len) {
	//len = len || 32;
	var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';   
	var maxPos = $chars.length;
	var pwd = '';
	for (i = 0; i < len; i++) {
		pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
	}
	return pwd;
}
function getajaxHttp() {
	var xmlHttp;
	try {
		// Firefox, Opera 8.0+, Safari
		xmlHttp = new XMLHttpRequest();
		} catch (e) {
			// Internet Explorer
			try {
				xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
			} catch (e) {
			try {
				xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
			} catch (e) {
				alert("您的浏览器不支持AJAX.");
				return false;
			}
		}
	}
	return xmlHttp;
}