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
D:\huangyg\git\js.sample\aijs>npm install @themaximalist/ai.js
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated glob@8.1.0: Glob versions prior to v9 are no longer supported
npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
npm warn cleanup Failed to remove some directories [
npm warn cleanup   [
npm warn cleanup     '\\\\?\\D:\\huangyg\\git\\js.sample\\aijs\\node_modules\\web-streams-polyfill',
npm warn cleanup     [Error: EPERM: operation not permitted, rmdir 'D:\huangyg\git\js.sample\aijs\node_modules\web-streams-polyfill\dist\types'] {
npm warn cleanup       errno: -4048,
npm warn cleanup       code: 'EPERM',
npm warn cleanup       syscall: 'rmdir',
npm warn cleanup       path: 'D:\\huangyg\\git\\js.sample\\aijs\\node_modules\\web-streams-polyfill\\dist\\types'
npm warn cleanup     }
npm warn cleanup   ]
npm warn cleanup ]
npm error code 1
npm error path D:\huangyg\git\js.sample\aijs\node_modules\hnswlib-node
npm error command failed
npm error command C:\Windows\system32\cmd.exe /d /s /c node-gyp rebuild
npm error gyp info it worked if it ends with ok
npm error gyp info using node-gyp@10.2.0
npm error gyp info using node@22.10.0 | win32 | x64
npm error gyp ERR! find Python
npm error gyp ERR! find Python Python is not set from command line or npm configuration
npm error gyp ERR! find Python Python is not set from environment variable PYTHON
npm error gyp ERR! find Python checking if the py launcher can be used to find Python 3
npm error gyp ERR! find Python - executable path is ""
npm error gyp ERR! find Python - "" could not be run
npm error gyp ERR! find Python checking if "python3" can be used
npm error gyp ERR! find Python - executable path is ""
npm error gyp ERR! find Python - "" could not be run
npm error gyp ERR! find Python checking if "python" can be used
npm error gyp ERR! find Python - executable path is ""
npm error gyp ERR! find Python - "" could not be run
npm error gyp ERR! find Python checking if Python is C:\Users\hyg\AppData\Local\Programs\Python\Python311\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Users\hyg\AppData\Local\Programs\Python\Python311\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Program Files\Python311\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Program Files\Python311\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Users\hyg\AppData\Local\Programs\Python\Python311-32\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Users\hyg\AppData\Local\Programs\Python\Python311-32\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Program Files\Python311-32\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Program Files\Python311-32\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Program Files (x86)\Python311-32\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Program Files (x86)\Python311-32\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Users\hyg\AppData\Local\Programs\Python\Python310\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Users\hyg\AppData\Local\Programs\Python\Python310\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Program Files\Python310\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Program Files\Python310\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Users\hyg\AppData\Local\Programs\Python\Python310-32\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Users\hyg\AppData\Local\Programs\Python\Python310-32\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Program Files\Python310-32\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Program Files\Python310-32\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Program Files (x86)\Python310-32\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Program Files (x86)\Python310-32\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Users\hyg\AppData\Local\Programs\Python\Python39\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Users\hyg\AppData\Local\Programs\Python\Python39\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Program Files\Python39\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Program Files\Python39\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Users\hyg\AppData\Local\Programs\Python\Python39-32\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Users\hyg\AppData\Local\Programs\Python\Python39-32\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Program Files\Python39-32\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Program Files\Python39-32\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Program Files (x86)\Python39-32\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Program Files (x86)\Python39-32\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Users\hyg\AppData\Local\Programs\Python\Python38\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Users\hyg\AppData\Local\Programs\Python\Python38\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Program Files\Python38\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Program Files\Python38\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Users\hyg\AppData\Local\Programs\Python\Python38-32\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Users\hyg\AppData\Local\Programs\Python\Python38-32\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Program Files\Python38-32\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Program Files\Python38-32\python.exe" could not be run
npm error gyp ERR! find Python checking if Python is C:\Program Files (x86)\Python38-32\python.exe
npm error gyp ERR! find Python - version is ""
npm error gyp ERR! find Python - version is  - should be >=3.6.0
npm error gyp ERR! find Python - THIS VERSION OF PYTHON IS NOT SUPPORTED
npm error gyp ERR! find Python - "C:\Program Files (x86)\Python38-32\python.exe" could not be run
npm error gyp ERR! find Python
npm error gyp ERR! find Python **********************************************************
npm error gyp ERR! find Python You need to install the latest version of Python.
npm error gyp ERR! find Python Node-gyp should be able to find and use Python. If not,
npm error gyp ERR! find Python you can try one of the following options:
npm error gyp ERR! find Python - Use the switch --python="C:\Path\To\python.exe"
npm error gyp ERR! find Python (accepted by both node-gyp and npm)
npm error gyp ERR! find Python - Set the environment variable PYTHON
npm error gyp ERR! find Python - Set the npm configuration variable python:
npm error gyp ERR! find Python npm config set python "C:\Path\To\python.exe"
npm error gyp ERR! find Python For more information consult the documentation at:
npm error gyp ERR! find Python https://github.com/nodejs/node-gyp#installation
npm error gyp ERR! find Python **********************************************************
npm error gyp ERR! find Python
npm error gyp ERR! configure error
npm error gyp ERR! stack Error: Could not find any Python installation to use
npm error gyp ERR! stack at PythonFinder.fail (C:\Users\hyg\AppData\Roaming\nvm\v22.10.0\node_modules\npm\node_modules\node-gyp\lib\find-python.js:306:11)
npm error gyp ERR! stack at PythonFinder.findPython (C:\Users\hyg\AppData\Roaming\nvm\v22.10.0\node_modules\npm\node_modules\node-gyp\lib\find-python.js:164:17)
npm error gyp ERR! stack at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
npm error gyp ERR! stack at async configure (C:\Users\hyg\AppData\Roaming\nvm\v22.10.0\node_modules\npm\node_modules\node-gyp\lib\configure.js:27:18)
npm error gyp ERR! stack at async run (C:\Users\hyg\AppData\Roaming\nvm\v22.10.0\node_modules\npm\node_modules\node-gyp\bin\node-gyp.js:81:18)
npm error gyp ERR! System Windows_NT 10.0.22631
npm error gyp ERR! command "C:\\Program Files\\nodejs\\node.exe" "C:\\Users\\hyg\\AppData\\Roaming\\nvm\\v22.10.0\\node_modules\\npm\\node_modules\\node-gyp\\bin\\node-gyp.js" "rebuild"
npm error gyp ERR! cwd D:\huangyg\git\js.sample\aijs\node_modules\hnswlib-node
npm error gyp ERR! node -v v22.10.0
npm error gyp ERR! node-gyp -v v10.2.0
npm error gyp ERR! not ok
npm error A complete log of this run can be found in: C:\Users\hyg\AppData\Local\npm-cache\_logs\2025-07-12T06_47_10_330Z-debug-0.log
*/