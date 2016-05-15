// server:
//      POST:create
//      PUT: Update
//      GET: read the private key
// page: create,encrypt,decrypt,change passphrase

var fs = require('fs');
var http = require('http');
var url = require("url");
var yaml = require('js-yaml');

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
        }else if(req.method == 'GET') {
            console.log("GET");
            var pathname = url.parse(req.url).pathname;
			var realPath = pathname.substring(1);
			console.log(realPath);
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
							res.writeHead(200, {'Content-Type':'text/html'});    // or text/x-yaml  to make client save a file
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