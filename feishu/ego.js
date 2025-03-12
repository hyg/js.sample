const http = require("http");
const https = require("https");
const config = require("./config.js");

var user_access_token;
var tenant_access_token;

// get tenant access token
var postData = JSON.stringify({
    "app_id": config.app_id,
    "app_secret": config.app_secret
});

const options_get_tenant_access_token = {
    hostname: 'open.feishu.cn',
    path: '/open-apis/auth/v3/tenant_access_token/internal',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(postData),
    },
};



const req_get_tenant_access_token = https.request(options_get_tenant_access_token, (res) => {
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

req_get_tenant_access_token.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req_get_tenant_access_token.write(postData);
req_get_tenant_access_token.end();

// create document
var document_id;

postData = JSON.stringify({
    "folder_token": "JM9kfrFcIlDgUDdpBubcwrrQnAc",
    "title": "日计划"
});

const options_get_document_id = {
    hostname: 'open.feishu.cn',
    path: '/open-apis/docx/v1/documents',
    method: 'POST',
    headers: {
        //'Authorization': 'Bearer '+tenant_access_token,
        'Authorization': 'Bearer t-g1042nkJQGV6MQE57PTKFZBPMZHQUTXRT6Q6OUBU',
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(postData),
    },
};
console.log("options_get_document_id: ",options_get_document_id);

const req_get_document_id = https.request(options_get_document_id, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
        var retdata = JSON.parse(chunk);
        document_id = retdata.data.document.document_id;
        console.log("document_id:", document_id);
    });
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req_get_document_id.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req_get_document_id.write(postData);
req_get_document_id.end();