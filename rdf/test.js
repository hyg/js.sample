const $rdf = require('rdflib')
const store  = $rdf.graph();
console.log('store=',store);
const VCARD = new $rdf.Namespace('http://www.w3.org/2006/vcard/ns#');

const me = store.sym('https://hyg.inrupt.net/profile/card#me');
const profile = me.doc(); 

console.log('\nstore=',store);
console.log('me=',me);
console.log('profile=',profile);
//console.log('VCARD=',VCARD);
//console.log('VCARD(fn)=',VCARD('fn'));
//console.log('VCARD(name)=',VCARD('name'));

//let name = store.any(me, VCARD('name'), null, profile);
let name = store.any(me, VCARD('name'));
//console.log('name=',name);
console.log('\nstore=',store);

let text = '<#this>  a  <#Example> .';

//let doc = $rdf.sym('https://example.com/alice/card');
//let store = $rdf.graph();

//console.log('doc=',doc);
//console.log('doc.uri=',doc.uri);
$rdf.parse(text, store, me.uri, 'text/turtle');  // pass base URI
//console.log('doc=',doc);
//console.log('doc.uri=',doc.uri);
console.log('\nstore=',store);

console.log($rdf.serialize(me, store, me.uri, 'text/turtle'));