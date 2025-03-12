const https = require("https");
const config = require("./config.js");
//https://open.feishu.cn/document/server-docs/docs/permission/permission-member/create?appId=cli_a730bc488cf8900e

var user_access_token;
var tenant_access_token;

// get tenant access token
var postData = JSON.stringify({
	"member_id": config.open_id,
	"member_type": "openid",
	"perm": "full_access",
	"perm_type": "container",
	"type": "user"
});
console.log("postData:",postData);
const options = {
    hostname: 'open.feishu.cn',
    path: '/open-apis/drive/v1/permissions/'+config.folder_token+'/members?type=folder',
    method: 'POST',
    headers: {
        'Authorization': 'Bearer '+config.user_access_token,
        'Content-Type': 'application/json; charset=utf-8'
    },
};
console.log("options:",options);

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
