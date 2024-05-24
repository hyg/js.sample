const neo4j = require('neo4j-driver')
const config = require('./config.js');

// Create a driver instance, for the user `neo4j` with password `password`.
// It should be enough to have a single driver per database per application.
var driver = neo4j.driver(
    config.NEO4J_URI,
    neo4j.auth.basic(config.NEO4J_USERNAME, config.NEO4J_PASSWORD)
)

// Create a session to run Cypher statements in.
// Note: Always make sure to close sessions when you are done using them!
var session = driver.session()

// the Promise way, where the complete result is collected before we act on it:
session.run('MATCH (n) DETACH DELETE n').then(
    //.run('CREATE (n:term {name:\'入门目录202404151600-3\',id:\'4b12ac08\',interface:{<term.4b12ac08.term.1>:\"附件21\",<term.4b12ac08.url.1>:\"<a href=\"mailto:huangyg@mars22.com?subject=其他可行方案&body=name: 入门目录202404151600-3%0D%0Aid: 4b12ac08%0D%0A---请勿修改以上内容 从下一行开始写您的方案---%0D%0A\">发送电子邮件</a>​\"},readme:\`\n      - \"可行\"是指：\n        - 方案的内容完整、准确、无二义性，具备相关岗位普通资质的人员可以自行阅读、使用。\n        - 在独立的第三方实施，可以按预期的比率产生预期的效果。\n       - 注意判断：成员下意识地把自己的工作特殊化、隐蔽化。\`,item:[0:{localid:\'\',text:\`\n          如果有其它可行方案请<term.4b12ac08.url.1>，我将按照<term.4b12ac08.term.1>核实。\`}]})
    () => session.run("CREATE (n:term {name:\'入门目录202404151600-3\',id:\'4b12ac08\'})"
    )).then(() => session
        .run('MERGE (index:term {id : \'4b12ac08\'}) RETURN index.name AS name'))
    .then(result => {
        result.records.forEach(record => {
            console.log(record.get('name'))
        })
    })
    .catch(error => {
        console.log(error)
    })
    .then(() => session.close())

// Close the driver when application exits.
// This closes all used network connections.
//driver.close() // returns a Promise
// Close the connection when the app stops
process.on("exit", async (code) => {
    await driver.close();
});
process.on("SIGINT", async () => {
    await driver.close();
});