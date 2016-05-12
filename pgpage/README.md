## openPGP 密钥托管

### REST API
####POST
####PUT
####GET
* 返回私钥文件
####DELETE
* 密钥拥有者必须以数字签名证实身份，方才能够删除密钥。
* 避免有状态的流程，争取一次操作完成。
* 需假设通信可以截获和伪造。因此不同密钥的删除语句应不同。
* DELETE请求的body是以下yaml结构及其数字签名：
	* userinfo
	* fingerprint

###
