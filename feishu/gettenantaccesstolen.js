const http = require("http");
const https = require("https");
const config = require("./config.js");

var tenant_access_token;

// get tenant access token
var postData = JSON.stringify({
    "app_id": config.app_id,
    "app_secret": config.app_secret
});

const options = {
    hostname: 'open.feishu.cn',
    path: '/open-apis/auth/v3/tenant_access_token/internal',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(postData),
    },
};



const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
        var retdata = JSON.parse(chunk);
        tenant_access_token = retdata.tenant_access_token;
        console.log("tenant_access_token:", tenant_access_token);
    });
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();
