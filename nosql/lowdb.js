import { LowSync } from 'lowdb'
import { JSONFileSync } from 'lowdb/node'

const db = new LowSync(new JSONFileSync('FSM.json'), {})
db.read()
console.log(db.data);
db.data.current = db.data.relation.find((r) => r.from === db.data.current && r.event === "ea").to
console.log(db.data.current);
db.data.current = db.data.relation.find((r) => r.from === db.data.current && r.event === "ea").to
console.log(db.data.current);
db.data.current = db.data.relation.find((r) => r.from === db.data.current && r.event === "ea").to
console.log(db.data.current);
db.data.current = db.data.relation.find((r) => r.from === db.data.current && r.event === "ea").to
console.log(db.data.current);
db.data.current = db.data.relation.find((r) => r.from === db.data.current && r.event === "ea").to
console.log(db.data.current);
db.data.current = db.data.relation.find((r) => r.from === db.data.current && r.event === "eb").to
console.log(db.data.current);
db.data.current = db.data.relation.find((r) => r.from === db.data.current && r.event === "eb").to
console.log(db.data.current);
db.data.current = db.data.relation.find((r) => r.from === db.data.current && r.event === "eb").to
console.log(db.data.current);
db.data.current = db.data.relation.find((r) => r.from === db.data.current && r.event === "eb").to
console.log(db.data.current);
db.data.current = db.data.relation.find((r) => r.from === db.data.current && r.event === "eb").to
console.log(db.data.current);
db.data.current = db.data.relation.find((r) => r.from === db.data.current && r.event === "eb").to
console.log(db.data.current);