import { fromDSL } from '@ipld/schema/from-dsl.js'

let schema = fromDSL(`
  type SimpleStruct struct {
    foo Int
    bar Bool
    baz String
  }
  type MyMap { String: SimpleStruct }
`)

console.dir(schema.types, { depth: Infinity })

// →
// {
//   SimpleStruct: {
//     struct: {
//       fields: {
//         foo: { type: 'Int' },
//         bar: { type: 'Bool' },
//         baz: { type: 'String' }
//       }
//     }
//   },
//   MyMap: { map: { keyType: 'String', valueType: 'SimpleStruct' } }
// }