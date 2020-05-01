const fs = require("fs")
const exec = require("child_process").execSync

const sqlOutputFile = `${__dirname}/output/bhs.sqlite`
const jsonOutputFile = `${__dirname}/output/word_features.json`

console.log("Checking for prepopulated sqlite")
if (!fs.existsSync(sqlOutputFile) || !fs.existsSync(jsonOutputFile)) {
	console.log(" - Does not exist, generating...")

	let result
	console.log(" - - Installing text-fabric")
	result = exec("pip install text-fabric --user")
	console.log(" - - Creating sqlite (will take a while)")
	result = exec(`python './1. create_sql_from_tf.py' ${sqlOutputFile} ${jsonOutputFile}`)
	// convert and show the output.
	// console.log(result.toString("utf8");
}
else {
	console.log(" - Found cached files!")
}

const word_features = require(jsonOutputFile)

const sqlite = require('better-sqlite3')
const db = sqlite(sqlOutputFile)

const prepare_word_iterator = () => {
	const rows = db.prepare('SELECT * FROM words').all()
	function* word_iterator() {
		for (let i = 0; i < rows.length; i++) {
			yield rows[i]
		}
	}
	return word_iterator
}
const prepare_text_iterator = () => {
	const rows = db.prepare('SELECT wid, text, trailer, reference_node_id FROM words ORDER BY wid').all()
	const rows_by_rid = {}
	rows.forEach(row => {
		rid = row.reference_node_id
		if (!(rid in rows_by_rid)) {
			rows_by_rid[rid] = []
		}
		const { wid, text, trailer } = row
		rows_by_rid[rid].push([ wid, text, trailer ])
	})
	function* text_iterator() {
		const rows_by_rid_keys = Object.keys(rows_by_rid) 
		for (let i = 0; i < rows_by_rid_keys.length; i++) {
			const key = rows_by_rid_keys[i]
			yield { rid: key, text: rows_by_rid[key] }
		}
	}
	return text_iterator
}
module.exports = {
	word_features: () => word_features,
	ti: () => prepare_text_iterator(),
	text_iterator: (parallel_id_object) => {
		parallel_id_object = {bhs, lxx, kjv}
	},
	word_iterator: prepare_word_iterator()
}
