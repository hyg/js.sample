const jp = require('jsonpath');
var fs = require('fs');
var yaml = require('js-yaml');

function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
}

var users = [
    { 'user': 'barney', 'age': 36, 'active': true },
    { 'user': 'fred', 'age': 40, 'active': false },
    { 'user': 'pebbles', 'age': 1, 'active': true }
];

const data = {
    "store": {
        "book": [
            {
                "category": "reference",
                "author": "Nigel Rees",
                "title": "Sayings of the Century",
                "price": 8.95
            }, {
                "category": "fiction",
                "author": "Evelyn Waugh",
                "title": "Sword of Honour",
                "price": 12.99
            }, {
                "category": "fiction",
                "author": "Herman Melville",
                "title": "Moby Dick",
                "isbn": "0-553-21311-3",
                "price": 8.99
            }, {
                "category": "fiction",
                "author": "J. R. R. Tolkien",
                "title": "The Lord of the Rings",
                "isbn": "0-395-19395-8",
                "price": 22.99
            }
        ],
        "bicycle": {
            "color": "red",
            "price": 19.95
        }
    }
};

function loadAER(year) {
    var AERmap = new Object();
    var voucherfolder = "../../ego/data/voucher/" + year;
    fs.readdirSync(voucherfolder).forEach(file => {
        if (file.substr(0, 4) == "AER.") {
            var AER = yaml.load(fs.readFileSync(voucherfolder + "/" + file, 'utf8'), { schema: yaml.CORE_SCHEMA });
            AERmap[file] = AER;
        }
    });
    return AERmap;
}
var AERmap = loadAER(2025);
var result, subset, debit, credit;
const str1 = "2025-05-10";
const str2 = "2025-05-17";

//result = jp.query(data,'$.store.book[*].author');
/*
> - Nigel Rees
- Evelyn Waugh
- Herman Melville
- J. R. R. Tolkien 
*/
//result = jp.query(data,'$..author');
/*
> - Nigel Rees
- Evelyn Waugh
- Herman Melville
- J. R. R. Tolkien 
*/
//result = jp.query(data,'$.store.*');
/**
 > - - category: reference
    author: Nigel Rees
    title: Sayings of the Century
    price: 8.95
  - category: fiction
    author: Evelyn Waugh
    title: Sword of Honour
    price: 12.99
  - category: fiction
    author: Herman Melville
    title: Moby Dick
    isbn: 0-553-21311-3
    price: 8.99
  - category: fiction
    author: J. R. R. Tolkien
    title: The Lord of the Rings
    isbn: 0-395-19395-8
    price: 22.99
- color: red
  price: 19.95
*/
//result = jp.query(data,'$.store..price');
/*
> - 8.95
- 12.99
- 8.99
- 22.99
- 19.95
*/
//result = jp.query(data,'$..book[2]');
/*
> - category: fiction
  author: Herman Melville
  title: Moby Dick
  isbn: 0-553-21311-3
  price: 8.99
*/
//result = jp.query(data,'$..book[(@.length-1)]');
/*
> - category: fiction
  author: J. R. R. Tolkien
  title: The Lord of the Rings
  isbn: 0-395-19395-8
  price: 22.99 
 */
//result = jp.query(data, '$..book[-1:]');
/*
> - category: fiction
  author: J. R. R. Tolkien
  title: The Lord of the Rings
  isbn: 0-395-19395-8
  price: 22.99
*/
//result = jp.query(data, '$..book[?(@.isbn)]');
/*
> - category: fiction
  author: Herman Melville
  title: Moby Dick
  isbn: 0-553-21311-3
  price: 8.99
- category: fiction
  author: J. R. R. Tolkien
  title: The Lord of the Rings
  isbn: 0-395-19395-8
  price: 22.99
*/
//result = jp.query(data, '$..book[?(@.price<10)]');
/*
> - category: reference
  author: Nigel Rees
  title: Sayings of the Century
  price: 8.95
- category: fiction
  author: Herman Melville
  title: Moby Dick
  isbn: 0-553-21311-3
  price: 8.99
*/
//result = jp.query(data, '$..*');
/*
> - book: &ref_0
    - &ref_2
      category: reference
      author: Nigel Rees
      title: Sayings of the Century
      price: 8.95
    - &ref_3
      category: fiction
      author: Evelyn Waugh
      title: Sword of Honour
      price: 12.99
    - &ref_4
      category: fiction
      author: Herman Melville
      title: Moby Dick
      isbn: 0-553-21311-3
      price: 8.99
    - &ref_5
      category: fiction
      author: J. R. R. Tolkien
      title: The Lord of the Rings
      isbn: 0-395-19395-8
      price: 22.99
  bicycle: &ref_1
    color: red
    price: 19.95
- *ref_0
- *ref_1
- *ref_2
- *ref_3
- *ref_4
- *ref_5
- reference
- Nigel Rees
- Sayings of the Century
- 8.95
- fiction
- Evelyn Waugh
- Sword of Honour
- 12.99
- fiction
- Herman Melville
- Moby Dick
- 0-553-21311-3
- 8.99
- fiction
- J. R. R. Tolkien
- The Lord of the Rings
- 0-395-19395-8
- 22.99
- red
- 19.95
*/
//result = jp.query(Object.values(AERmap), '$[?(@.date> "2025-05-10" && @.date< "2025-05-16")]');
result = jp.query(Object.values(AERmap), '$[?(@.date.match("2025-06"))]');

log(yaml.dump(result));
//console.table(result);  