const https = require("https");
const config = require("./config.js");

https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document-block/patch

var tenant_access_token;

// get tenant access token
var postData = JSON.stringify({
    "update_text_elements": {
        "elements": [
            {
                "text_run": {
                    "content": `# 2025.02.23.
日计划

根据[ego模型时间接口](https://gitee.com/hyg/blog/blob/master/timeflow.md)，今天绑定模版1(1f)。

| 时间片 | 时长 | 用途 | 手稿 |
| --- | --- | :---: | --- |
| 14:46~15:00 | 15 | 休整 |  |
| 15:01~16:00 | 60 | 备餐、运动 |  |
| 16:01~16:45 | 45 | 晚餐 |  |
| 16:46~17:30 | 45 | 会议、自习 |  |
| 17:31~18:30 | 60 | 静默工作 | PSMD:meta data微调[在线](http://simp.ly/p/xtgD4F)[离线](../../draft/2025/20250223.01.md) <a href="mailto:huangyg@mars22.com?subject=关于2025.02.23.[PSMD:meta data微调]任务&body=日期: 202250223%0D%0A序号: 5%0D%0A手稿:../../draft/2025/20250223.01.md%0D%0A---请勿修改邮件主题及以上内容 从下一行开始写您的想法---%0D%0A">[想法]</a> |
| 18:31~19:30 | 60 | 休整 |  |
| 19:31~20:59 | 90 | 静默工作 | ego:手稿从simplenote转移到飞书的设计[在线](http://simp.ly/p/j1SspP)[离线](../../draft/2025/20250223.02.md) <a href="mailto:huangyg@mars22.com?subject=关于2025.02.23.[ego:手稿从simplenote转移到飞书的设计]任务&body=日期: 202250223%0D%0A序号: 7%0D%0A手稿:../../draft/2025/20250223.02.md%0D%0A---请勿修改邮件主题及以上内容 从下一行开始写您的想法---%0D%0A">[想法]</a> |
| 21:00~21:59 | 60 | 讨论、整理提交 |  |

---
`
                }
            }
        ]
    }
});

const options = {
    hostname: 'open.feishu.cn',
    path: '/open-apis/docx/v1/documents/YGKCdRKvGoRltkxRPTgciKFznif/blocks/Jw2QdZoWtohRupx7BfjcjOzen0g',
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
