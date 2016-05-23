// server:
//      POST:create
//      PUT: Update
//      GET: read the private key
// page: create,encrypt,decrypt,change passphrase

var fs = require('fs');
var http = require('http');
var url = require("url");
var yaml = require('js-yaml');
var openpgp = require('openpgp');

var server = http.createServer(function (req, res) {
    var chunk = ""; 
	req.on('data', function(data){
      chunk += data ;
    });
	req.on('end', function(){
        console.log('\nBODY: ' + chunk);
		console.log('BODY length: ' + chunk.length);
        if(req.method == 'POST') {
            console.log("POST");
            var body = yaml.safeLoad(chunk);
            var realPath = body.email + ".keyinfo"
             
            // read the private key
            // get the user info and check it is new
            // save into file
            fs.exists(realPath, function (exists) {
				if (!exists) {
                    fs.writeFileSync(realPath,chunk);
                    res.writeHead(200, {'Content-Type':'text/html'});    // or text/x-yaml  to make client save a file
			        res.write(realPath+" saved.");    
			        res.end();
                }else{
                    res.writeHead(406, {'Content-Type':'text/html'});    // or text/x-yaml  to make client save a file
			        res.write("this email was used. try another pls.");    
			        res.end();
                }
            });
        }else if(req.method == 'PUT') {
            console.log("PUT");
            var CleartextMessage  = openpgp.cleartext.readArmored(chunk);
            console.log("CleartextMessage.text:\n"+CleartextMessage.text);
            var body = yaml.safeLoad(CleartextMessage.text);
            var realPath = body.email + ".keyinfo"
            fs.exists(realPath, function (exists) {
				if (exists) {
                    var oldkeyinfo = yaml.safeLoad(fs.readFileSync(realPath,'utf8'));
                    var oldpublicKey = openpgp.key.readArmored(oldkeyinfo.pubkey).keys[0];
                    
                    //openpgp.verifyClearSignedMessage(oldpublicKey,CleartextMessage).then(function(verifiedmessage){
                    openpgp.verify({ publicKeys:[oldpublicKey], message:CleartextMessage }).then(function(verifiedmessage){
						// success
						//console.log("verifiedmessage.data:\n"+verifiedmessage.data+"\n");
						
						for (var i=0;i<verifiedmessage.signatures.length;i++)
						{
							console.log("\nSigner No. "+i+"  :\tkeyid:"+verifiedmessage.signatures[i].keyid.toHex() +"\tvalid:"+verifiedmessage.signatures[i].valid);
						}
                        
                        fs.writeFileSync(realPath,verifiedmessage.data);
                        
                        res.writeHead(200, {'Content-Type':'text/html'});    // or text/x-yaml  to make client save a file
                        res.write(realPath+" saved.");    
                        res.end();
					}).catch(function(error) {
						// failure
                        res.writeHead(401, {'Content-Type':'text/html'});    // or text/x-yaml  to make client save a file
	                    res.write("can't find any key under this email.");    
	                    res.end();
						console.log("签名验证失败");
					});
                }else{
                    res.writeHead(412, {'Content-Type':'text/html'});    // or text/x-yaml  to make client save a file
			        res.write("can't find any key under this email.");    
			        res.end();
                    console.log("更新的密钥不存在。");
                }
            });
        }else if(req.method == 'GET') {
            console.log("GET");
            var pathname = url.parse(req.url).pathname;
			var realPath = pathname.substring(1);
            var suffix =/\.[^\.]+/.exec(realPath);
			console.log(realPath);
            console.log(suffix);
            // read the userid
            // read the key
            // encoding and respond
            //var options = {encoding:'utf8'}
            fs.exists(realPath, function (exists) {
				if (!exists) {
					res.writeHead(404, {'Content-Type': 'text/plain'});
					res.write("找不到文件","utf8");
					res.end();
				} else {
                    fs.readFile(realPath, "binary", function(err, file){    
						if ( err ) {    
							res.writeHead(500, {'Content-Type': 'text/plain'});    
							res.write(err);    
							res.end();    
						} else {
							//console.log(file);
                            if(suffix == ".css"){
                                res.writeHead(200, {'Content-Type':'text/css'});
                            }else{
                                res.writeHead(200, {'Content-Type':'text/html'});    // or text/x-yaml  to make client save a file    
                            }
							
							res.write(file, "binary");    
							res.end();    
						}
                    })
                }
            })
        }else if(req.method == 'DELETE') {
            console.log("DELETE");
            // verify the sign
            // 

        }
    })
});

// pgp：747
server.listen(747);