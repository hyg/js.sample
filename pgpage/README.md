## openPGP 密钥托管


###keyinfo（infra v0.2使用）
* name
* id
* email
* salt：盐
* pubkey：公钥
* secpey：私钥

用户掌握口令（passphrase），口令与盐一起取哈希就是私钥加密密码。这个过程在页面完成，不暴露到网络上。
 
> var truepassphrase = SHA512.hex(salt + passphrase) ;  
> privateKey.encrypt(truepassphrase);

### REST API of keyrepo.js
####POST：提交新密钥
* body：keyinfo的yaml序列化文本。
* 返回：
	* 200：xxxx saved.(提交成功，其中xxxx为服务端保存文件名)
	* 406：this email was used. try another pls.

####PUT：修改已有的密钥口令
* body：cleartext数字签名后的新keyinfo。
* 返回：
	* 200：xxxx saved.(提交成功，其中xxxx为服务端保存文件名)
	* 401：bad signature.
	* 412：can't find any key under this email.

####GET：获取密钥
* 和web服务部署在一起时，该接口可以与其它静态文件公用。url中直接指明需要获取的keyinfo文件路径。
* 返回：
	* 200：keyinfo文件内容（yaml序列化文本）。
	* 404：找不到文件。
	* 500：具体错误信息。

###key.util.js
供页面调用的代码库，必须在它之前引用js-yaml、hashes、openpgp、FileSaver等js库。
以下参数url为服务端地址和端口：

* createandsave(url)：创建并提交密钥
* getkey(url)：获取密钥，导出密钥时也调用这个函数。
* changepassphrase(url,callback)：修改口令
	* callback：回调函数，收到服务端返回后调用。
* importkeyV0_1(pubkey,seckey,url)：导入infra v0.1版本密钥
	* pubkey：公钥文件的armor文本。
	* seckey：私钥文件的armor文本。
	* 调用后会进行加盐，重新设置私钥口令。
* postkey(keyinfo,url)：提交密钥。导入本版本密钥时直接调用，createandsave也使用这个函数。

###注意事项
* 一般浏览器都禁止[跨域访问](http://www.cnblogs.com/rainman/archive/2011/02/20/1959325.html)，因此密钥托管服务应与web服务不熟在一起。
* 使用端口需要权限，服务端后台运行可以使用： nohup sudo node keyrepo.js &

###范例
* create.html：创建密钥
* getkey.html：获取密钥
* update.html：修改口令
* exportkey.html：导出密钥
* importkey.html：导入密钥

###相关资料
* [RFC4880：OpenPGP Message Format](https://tools.ietf.org/html/rfc4880)
* [openpgp.js:OpenPGP JavaScript Implementation](https://github.com/openpgpjs/openpgpjs)
* [YAML: YAML Ain't Markup Language](http://yaml.org/)