const fs = require("fs")
const csv = require('csv-parser')
const sqlite = require("sqlite3")
const ReferenceParser = require("referenceparser").default
const rp = new ReferenceParser()

const { reference_to_versioned_id } = require("../generate_ids/generate_versification_versioned_parallel_id")

const INSERT_LIMIT = 5
const db = new sqlite.Database('./alignment.sqlite')

// Completely not done
// I switched to using Michael Stead's work...



const drop_table = name => `
DROP TABLE IF EXISTS ${name};`

const create_table = name => `
CREATE TABLE ${name} (
 nrsv INTEGER,
 ${name} INTEGER
);`

const insert_into_table = (name, values) => `
INSERT INTO ${name} VALUES 
${values.map(v =>
	`(${v[0]}, ${v[1]})`
).join(",")}`

const build = () => new Promise((resolve, reject) => {

	db.serialize(function () {
		db.run(drop_table("bhs"))
		db.run(create_table("bhs"))

		let bulk_insert = []
		const do_insert = force => {
			if (force || bulk_insert.length >= INSERT_LIMIT) {
				const values = bulk_insert.splice(0, INSERT_LIMIT)
				const query = insert_into_table("bhs", values)
				const stmt = db.prepare(query)
				stmt.run()
				stmt.finalize()

				if (bulk_insert.length >= INSERT_LIMIT) {
					do_insert()
				}
			}
		}

		fs.createReadStream('paratext-OT.csv')
			.pipe(csv())
			.on('data', (row) => {
				console.log(row)
				if (row["Original"] === ":") {
					return
				}
				const nrsv_ref = rp.parse(row["NRSV"])
				const nrsv_id = reference_to_versioned_id({ versification_schema: "kjv", ...nrsv_ref })
				const bhs_ref = rp.parse(row["Original"])
				const bhs_id = reference_to_versioned_id({ versification_schema: "bhs", ...bhs_ref })
				if (!Number.isInteger(nrsv_id) || !Number.isInteger(bhs_id)) {
					console.log(row, nrsv_ref, bhs_ref)
					process.exit()
				}
				bulk_insert.push([nrsv_id, bhs_id])
				do_insert()
			})
			.on('end', () => {
				do_insert(true)
				resolve()
			})
	})
})
build().then(then => {
	db.close()
})

