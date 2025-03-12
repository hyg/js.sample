const https = require("https");
const config = require("./config.js");

// https://open.feishu.cn/document/server-docs/docs/permission/permission-public/patch

var tenant_access_token;

// get tenant access token
var postData = JSON.stringify({
    "external_access": true,
    "link_share_entity": "anyone_readable",
    "invite_external": true
});

const options = {
    hostname: 'open.feishu.cn',
    path: '/open-apis/drive/v1/permissions/YGKCdRKvGoRltkxRPTgciKFznif/public?type=docx',
    method: 'PATCH',
    headers: {
        'Authorization': 'Bearer ' + config.tenant_access_token,
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
