const sqlite = require("better-sqlite3")

const INSERT_LIMIT = 5000
const db = sqlite("./output/data.sqlite")

db.exec(`DROP TABLE IF EXISTS verse_text;`)
db.exec(`
CREATE TABLE verse_text (
  rid INTEGER,
  text TEXT
);`)

const insert_into_table = values => `
INSERT INTO verse_text VALUES 
${values.map(v =>
	`(${v[0]}, '${v[1]}')`
).join(",")}`



const wordCursor = db.prepare(`SELECT wid, text, trailer, rid FROM word_features;`)

console.log("Iterating over rows")
let counter = 0
let bulk_insert = []
let previous_rid = 0
let verse_text = []
for (const row of wordCursor.iterate()) {
    let { wid, text, trailer, rid } = row
    if (previous_rid !== rid) {
        if (previous_rid > 0) {
            bulk_insert.push([+previous_rid, JSON.stringify(verse_text)])
        }
        verse_text = []
        previous_rid = rid
    }
    if (!text && !trailer) {
        continue
    }
    trailer = trailer || ""
    text = text || ""
    verse_text.push({wid,text,trailer})
}
bulk_insert.push([+previous_rid, JSON.stringify(verse_text)])
console.log(bulk_insert.length)

console.log("Inserting verse text")
while(bulk_insert.length > 0){
    console.log(bulk_insert.length)
    const values = bulk_insert.splice(0, INSERT_LIMIT)
    const query = insert_into_table(values)
    const stmt = db.prepare(query)
    stmt.run()
    counter += values.length
    console.log(counter)
}


const fs = require("fs")
const module_data = {
    "name": "Tagged BHS with Syntax Trees",
    "abbreviation": "ETCBC BHSA",
    "versification_schema": "bhs",
    "license": "Attribution-NonCommercial 4.0 International (<a href='https://creativecommons.org/licenses/by-nc/4.0/'>CC BY-NC 4.0</a>)",
    "url": "http://dx.doi.org/10.17026%2Fdans-z6y-skyh"
}
fs.writeFileSync("./output/version.json", JSON.stringify(module_data), "utf-8")