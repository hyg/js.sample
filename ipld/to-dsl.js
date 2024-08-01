import { toDSL } from '@ipld/schema/to-dsl.js'
const schema = {
  types: {
    SimpleStruct: {
      struct: {
        fields: {
          foo: { type: 'Int' },
          bar: { type: 'Bool' },
          baz: { type: 'String' }
        }
      }
    },
    MyMap: { map: { keyType: 'String', valueType: 'SimpleStruct' } }
  }
}

console.log(toDSL(schema))

// →
// type SimpleStruct struct {
//   foo Int
//   bar Bool
//   baz String
// }
//
// type MyMap {String:SimpleStruct}