const gitlet = require("./gitlet.js");

//gitlet.add("D:\\huangyg\\git\\js.sample\\git\\gitlet.js");
/* D: \huangyg\git\js.sample\git > node gitlet.test
node: fs: 284
function existsSync(path) {
                   ^

        RangeError: Maximum call stack size exceeded
    at Object.existsSync(node: fs: 284: 20)
    at gitletDir(D: \huangyg\git\js.sample\git\gitlet.js: 1806: 14)
    at gitletDir(D: \huangyg\git\js.sample\git\gitlet.js: 1816: 18)
    at gitletDir(D: \huangyg\git\js.sample\git\gitlet.js: 1816: 18)
    at gitletDir(D: \huangyg\git\js.sample\git\gitlet.js: 1816: 18)
    at gitletDir(D: \huangyg\git\js.sample\git\gitlet.js: 1816: 18)
    at gitletDir(D: \huangyg\git\js.sample\git\gitlet.js: 1816: 18)
    at gitletDir(D: \huangyg\git\js.sample\git\gitlet.js: 1816: 18)
    at gitletDir(D: \huangyg\git\js.sample\git\gitlet.js: 1816: 18)
    at gitletDir(D: \huangyg\git\js.sample\git\gitlet.js: 1816: 18)

    Node.js v22.10.0 */

gitlet.add();
