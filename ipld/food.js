import { fromDSL } from '@ipld/schema/from-dsl.js'
import { create } from '@ipld/schema/typed.js'
import yaml from 'js-yaml'
import fs from 'fs'

// a schema for a terse data format
const schemaDsl = fs.readFileSync("food.ipldsch","utf-8");

// parse schema
const schemaDmt = fromDSL(schemaDsl)

// create a typed converter/validator
const schemaTyped = create(schemaDmt, 'foodlog')

const typedData = yaml.load(fs.readFileSync("../../raw/food/d.20240803.yaml","utf-8"));
console.log("typedData:\n%s",typedData);

// validate and transform back into representation form
const newData = schemaTyped.toRepresentation(typedData)
if (newData === undefined) {
  throw new TypeError('Invalid data form, does not match schema')
}

// what do we have?
console.log('newData:\n%s',newData)
console.log('newData in json:', JSON.stringify(newData))

// →
// ["Home",460,250,[[1,32],[1,30],[1,30],[2,10],[2,11],[3,140],[4,230],[4,200],[2,5]]]