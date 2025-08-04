const AI = require("@themaximalist/ai.js");
await AI("what is the codeword?"); // i don't know any codewords

const ai = new AI("the codeword is blue");
await ai.chat("what is the codeword?"); // blue

/* D:\huangyg\git\js.sample\aijs>node test
file:///D:/huangyg/git/js.sample/aijs/test.js:1
const AI = require("@themaximalist/ai.js");
           ^

ReferenceError: require is not defined in ES module scope, you can use import instead
    at file:///D:/huangyg/git/js.sample/aijs/test.js:1:12
    at ModuleJob.run (node:internal/modules/esm/module_job:268:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:543:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:116:5)

Node.js v22.10.0 */

/*
Enable at least one service by setting its environment API_KEY

export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
export GOOGLE_API_KEY=sk-ant-...
export STABILITY_API_KEY=sk-...
export REPLICATE_API_KEY=sk-....
export MISTRAL_API_KEY=...

不适合非IT专业用户的本地环境
*/