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
            // load keyinfo from yaml
            var body = yaml.safeLoad(chunk);
            // make the keyinfo file name
            var realPath = body.email + ".keyinfo"
            
            // check if the key under the same email is exist
            fs.exists(realPath, function (exists) {
				if (!exists) {
                    // save the key and return the file name
                    fs.writeFileSync(realPath,chunk);
                    res.writeHead(200, {'Content-Type':'text/html'});    // or text/x-yaml  to make client save a file
			        res.write(realPath+" saved.");    
			        res.end();
                }else{
                    // this email was used
                    res.writeHead(406, {'Content-Type':'text/html'});    // or text/x-yaml  to make client save a file
			        res.write("this email was used. try another pls.");    
			        res.end();
                }
            });
        }else if(req.method == 'PUT') {
            console.log("PUT");
            // read the keyinfo yaml clear text from signed block
            var CleartextMessage  = openpgp.cleartext.readArmored(chunk);
            console.log("CleartextMessage.text:\n"+CleartextMessage.text);
            // load the new keyinfo from yaml
            var body = yaml.safeLoad(CleartextMessage.text);
            // make the keyinfo file name
            var realPath = body.email + ".keyinfo"
            // check if the key under the same email is exist
            fs.exists(realPath, function (exists) {
				if (exists) {
                    // load the keyinfo from old file
                    var oldkeyinfo = yaml.safeLoad(fs.readFileSync(realPath,'utf8'));
                    // get the old public key. NOTICE: can't use the new public here.
                    var oldpublicKey = openpgp.key.readArmored(oldkeyinfo.pubkey).keys[0];
                    // verify the signature use the old public key
                    openpgp.verify({ publicKeys:[oldpublicKey], message:CleartextMessage }).then(function(verifiedmessage){
						// success: list the signers
						for (var i=0;i<verifiedmessage.signatures.length;i++)
						{
							console.log("\nSigner No. "+i+"  :\tkeyid:"+verifiedmessage.signatures[i].keyid.toHex() +"\tvalid:"+verifiedmessage.signatures[i].valid);
						}
                        
                        // save the new keyinfo
                        fs.writeFileSync(realPath,verifiedmessage.data);
                        
                        res.writeHead(200, {'Content-Type':'text/html'});    // or text/x-yaml  to make client save a file
                        res.write(realPath+" saved.");    
                        res.end();
					}).catch(function(error) {
						// failure
                        res.writeHead(401, {'Content-Type':'text/html'});    // or text/x-yaml  to make client save a file
	                    res.write("bad signature.");    
	                    res.end();
						console.log("签名验证失败");
					});
                }else{
                    // the key is not exist.
                    res.writeHead(412, {'Content-Type':'text/html'});    // or text/x-yaml  to make client save a file
			        res.write("can't find any key under this email.");    
			        res.end();
                    console.log("更新的密钥不存在。");
                }
            });
        }else if(req.method == 'GET') {
            console.log("GET");
            // process as the normal static file
            // get the file path and name from url
            var pathname = url.parse(req.url).pathname;
			var realPath = pathname.substring(1);
            // get the suffix to detect the MIME type
            var suffix =/\.[^\.]+/.exec(realPath);
			console.log(realPath);
            console.log(suffix);
            // check if the file is exist
            fs.exists(realPath, function (exists) {
				if (!exists) {
					res.writeHead(404, {'Content-Type': 'text/plain'});
					res.write("找不到文件","utf8");
					res.end();
				} else {
                    // exist:read the file
                    fs.readFile(realPath, "binary", function(err, file){    
						if ( err ) {    
							res.writeHead(500, {'Content-Type': 'text/plain'});    
							res.write(err);    
							res.end();    
						} else {
							// return the content in right MIME type
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
            // TBD
            // assume the attacker obtain all keys already, so don't delete any key here. 

        }
    })
});

// pgp：747
server.listen(747);