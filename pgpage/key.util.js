﻿
// openpgp keypair utility
// save to server, use in page.
// place these BEFOEE this js src
// <script src="js-yaml.min.js"></script>
// <script src="hashes.min.js"></script>
// <script src="openpgp.min.js"></script>

var keyinfo = new Object();

function createandsave(url){
	var openpgp = window.openpgp;
	var name = prompt('请输入姓名:');
	var id = prompt('请输入ID:');
	var email = prompt('请输入Email:');
	var passphrase = prompt('请输入口令:');
	var salt = randomString(128);

	var SHA512 = new Hashes.SHA512;
	var truepassphrase = SHA512.hex(salt + passphrase) ;
	
	var publicKey,privateKey;
	
	var UserId = name + " (" + id + ") <" + email + ">" ;
	var opt = {numBits: 2048, userId: UserId, passphrase: truepassphrase};
	
	keyinfo.name = name;
	keyinfo.id = id;	
	keyinfo.email = email;
	keyinfo.salt = salt;
	
	openpgp.generateKeyPair(opt).then(function(key) {
		publicKey = openpgp.key.readArmored(key.publicKeyArmored).keys[0];
		privateKey = openpgp.key.readArmored(key.privateKeyArmored).keys[0];
		
		keyinfo.pubkey = key.publicKeyArmored;
		keyinfo.seckey = key.privateKeyArmored;
		var body = jsyaml.safeDump(keyinfo);
		
		var xmlhttp=getajaxHttp();
		xmlhttp.onreadystatechange=function(){
			if(xmlhttp.readyState==4){
				alert("xmlhttp.status:\n"+xmlhttp.status+"\nxmlhttp.responseText:\n"+xmlhttp.responseText);
			}
		};
		xmlhttp.open("post",url,true);
		xmlhttp.send(body);
	});
}

function getkey(url){
	var email = prompt('请输入email:');
	var xmlhttp=getajaxHttp();

	var path = url + email + ".keyinfo" ;
	xmlhttp.open("get",path,false);
	xmlhttp.send(email);

	if(xmlhttp.status == 200){
		keyinfo = jsyaml.safeLoad(xmlhttp.responseText);
		alert("密钥获取成功\n\n"+"xmlhttp.status:\n"+xmlhttp.status+"\nxmlhttp.responseText:\n"+xmlhttp.responseText);
	}else{
		alert("密钥获取失败\n\n"+"xmlhttp.status:\n"+xmlhttp.status+"\nxmlhttp.responseText:\n"+xmlhttp.responseText);
	}
	
	return keyinfo;
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