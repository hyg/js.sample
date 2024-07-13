const fs = require('fs');
const yaml = require('js-yaml');
const Ajv = require("ajv")
const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}

const schema = {
  type: "object",
  properties: {
    foo: {type: "integer"},
    bar: {type: "string"}
  },
  required: ["foo"],
  additionalProperties: false
}

const yamlschemastr = `
$schema: http://json-schema.org/draft-07/schema#
title: Entity
type: object
properties:
  id:
    type: string
  name:
    type: string
  aliases: 
    type: array
    items:
      type: string
  data:
    type: object
    properties:
      id:
        type: string
      name:
        type: string
      entityname:
        type: string
      events:
        type: array
        items:
          type: object
          properties:
            id: 
              type: string
            name: 
              type: string
            readme: 
              type: string
            log: 
              type: string
            comment: 
              type: string
      todos:
        type: array
        items:
          type: object
          properties:
            id: 
                type: string
            name: 
                type: string
            readme: 
                type: string
            log: 
                type: string
            comment: 
                type: string
  cognize:
    type: string
required:
  - id
  - name
`;

var validate = ajv.compile(schema)

const data = {
  foo: 1,
  bar: "abc"
}

var data2 ;

var datastr = `
id: huangyg
name: huang yonggang
aliases: 
  - ego
data:
  id: hyg.data
  name: data instance of entity "huangyg"
  entityid: huangyg
  events:
    - id: hyg.data.event
      name: the event queue of entity "huangyg"
      readme: "ego.data.event"
  todos: 
    - id: hyg.data.todo
      name: the todo item of entity "huangyg"
      readme: "ego.data.todo"
cognize: "ego.data.congnize"
`;

const valid = validate(data)
if (!valid) console.log(validate.errors)

var yamlschema = yaml.load(yamlschemastr);

data2 = yaml.load(datastr);
var result = ajv.validate(yamlschema,data2);
if (!result) console.log(ajv.errors);

datastr = `
id: ORCID:0009-0005-7296-5316
name: 黄勇刚
aliases:
  - huangyg
  - mars22
  - fromoon
  - samadhi
data:
  entityid: ORCID:0009-0005-7296-5316
  todos:
    - id: "20240612165400"
      name: linkml, yaml-ld
      subject: learn
      time: 60
      readme: |
        - https://linkml.io/linkml/schemas/models.html
        - https://linkml.io/linkml/intro/tutorial03.html
cognize: "1"
protocol: 2
offer: 3`;

data2 = yaml.load(datastr);

result = ajv.validate(yamlschema,data2);
if (!result) console.log(ajv.errors);

validate = ajv.compile(yamlschema);
result = validate(data2);
if (!result) console.log(ajv.errors);
