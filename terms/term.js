const fs = require('fs');
const yaml = require('js-yaml');
const Ajv = require("ajv")
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

var schema = JSON.parse(fs.readFileSync(".\\term.model.json", 'utf8'));
console.log("schema:",schema);

const data = yaml.load(fs.readFileSync("D:\\huangyg\\git\\PSMD\\data\\term.9d12877c.yaml", 'utf8'));

console.log("data:",data);

/* var validate = ajv.compile(schema)
const valid = validate(data)
if (!valid) console.log(validate.errors) */

var result = ajv.validate(schema, data);
if (!result)
    console.log(ajv.errors);
else console.log("validate pass");
