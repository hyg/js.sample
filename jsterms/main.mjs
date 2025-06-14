import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const yaml = require('js-yaml');

import * as term from "./term12.mjs";


term.init();
//log(yaml.dump(term.metadata));
console.log("%o",term.metadata);
term.metadata.code["1.e1"]();
console.log("%o",term.metadata.subterm[0]);
term.metadata.code["1.e2"]();
console.log("%o",term.metadata.subterm[0]);
