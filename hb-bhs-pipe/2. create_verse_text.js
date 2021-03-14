const sqlite = require("sqlite3")

const INSERT_LIMIT = 5000
const db = new sqlite.Database('./output/bhs.sqlite')

const drop_table = `
DROP TABLE IF EXISTS verse_text;`

const create_table =`
CREATE TABLE verse_text (
  rid INTEGER,
  text TEXT
);`

const insert_into_table = values => `
INSERT INTO verse_text VALUES 
${values.map(v =>
	`(${v[0]}, '${v[1]}')`
).join(",")}`





const build = () => new Promise((resolve, reject) => {
	db.serialize(function () {

		db.run(drop_table)
		db.run(create_table)
        db.all(`SELECT wid, text, trailer, rid FROM word_features;`, (err, rows) => {

            let counter = 0
            let bulk_insert = []

            let previous_rid = 0
            let verse_text = []
            rows.forEach(({wid,text,trailer,rid}) => {
                if (previous_rid !== rid) {
                    if (previous_rid > 0) {
                        bulk_insert.push([+previous_rid, JSON.stringify(verse_text)])
                    }
                    verse_text = []
                    previous_rid = rid
                }
                if (!text && !trailer) {
                    return
                }
                trailer = trailer || ""
                text = text || ""
                verse_text.push({wid,text,trailer})
            })

            while(bulk_insert.length > 0){
                const values = bulk_insert.splice(0, INSERT_LIMIT)
                const query = insert_into_table(values)
                const stmt = db.prepare(query)
                stmt.run()
                stmt.finalize()
                counter += values.length
                console.log(counter)
            }

            resolve()
        })

	})
})
build().then(then => {
	db.close()
})


const fs = require("fs")
const module_data = {
    "name": "Tagged BHS with Syntax Trees",
    "abbreviation": "ETCBC BHSA",
    "versification_schema": "bhs",
    "license": "Attribution-NonCommercial 4.0 International (<a href='https://creativecommons.org/licenses/by-nc/4.0/'>CC BY-NC 4.0</a>)",
    "url": "http://dx.doi.org/10.17026%2Fdans-z6y-skyh"
   }
fs.writeFileSync("./output/bhs.json", JSON.stringify(module_data), "utf-8")