const fs = require('fs');
const yaml = require('js-yaml');
const Ajv = require("ajv")
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

var schema = JSON.parse(fs.readFileSync("D:\\huangyg\\git\\ego\\data\\raw.food.json", 'utf8'));
console.log("schema:",schema);

const data = yaml.load(fs.readFileSync("D:\\huangyg\\git\\raw\\food\\d.20240713.yaml", 'utf8'));
console.log("data:",data);

schema = JSON.parse(`{
    "$defs": {
        "Item": {
            "additionalProperties": false,
            "description": "",
            "properties": {
                "amount": {
                    "type": "string"
                },
                "name": {
                    "type": "string"
                },
                "time": {
                    "type": "string"
                },
                "unit": {
                    "type": "string"
                }
            },
            "title": "Item",
            "type": "object"
        },
        "Raw.food": {
            "additionalProperties": false,
            "description": "",
            "properties": {
                "comment": {
                    "type": "string"
                },
                "date": {
                    "type": "string"
                },
                "food": {
                    "items": {
                        "$ref": "#/$defs/Item"
                    },
                    "type": "array"
                },
                "log": {
                    "type": "string"
                },
                "med": {
                    "items": {
                        "$ref": "#/$defs/Item"
                    },
                    "type": "array"
                },
                "water": {
                    "items": {
                        "$ref": "#/$defs/Item"
                    },
                    "type": "array"
                }
            },
            "title": "Raw.food",
            "type": "object"
        }
    },
    "$id": "https://raw.githubusercontent.com/hyg/ego/vat/data/raw.food",
    "additionalProperties": true,
    "title": "raw.food",
    "type": "object"
}`);

/* var validate = ajv.compile(schema)
const valid = validate(data)
if (!valid) console.log(validate.errors) */

var result = ajv.validate(schema, data);
if (!result)
    console.log(ajv.errors);
else console.log("validate pass");
