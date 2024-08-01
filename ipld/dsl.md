## 16:00~16:59
learn: [schema in ipld,coding time.]

- readme: |
      - https://www.npmjs.com/package/@ipld/schema
      - https://github.com/ipld/js-ipld-schema
      - read 2024.07.22 14:00 draft
- D:\huangyg\git\js.sample\ipld
- npm i @ipld/schema
- "type": "module" -> D:\huangyg\git\js.sample\ipld\package.json

```ipldsch
type SimpleStruct struct {
    foo Int
    bar Bool
    baz String
  }
  type MyMap { String: SimpleStruct }
```