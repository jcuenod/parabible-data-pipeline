const fs = require("fs")
const exec = require("child_process").execSync

const word_features = require("./word_features.json")
const outputFile = "./output/bhs.sqlite"

console.log("Checking for prepopulated sqlite")
if (!fs.existsSync(outputFile)) {
	console.log(" - Does not exist, generating...")

	let result
	console.log(" - - Installing text-fabric")
	result = exec("pip install text-fabric --user")
	console.log(" - - Creating sqlite (will take a while)")
	result = exec(`python ./1.\ create_sqlite_from_tf.py ${outputFile}`)
	// convert and show the output.
	// console.log(result.toString("utf8");
}

const sqlite = require('better-sqlite')
const db = sqlite(outputFile)

const prepare_word_iterator = () => {
	const row = db.prepare('SELECT * FROM words').all()
	return function* word_iterator() {
		row.forEach(w => {
			yield w
		})
	}
}
const prepare_text_iterator = () => {
	const rows = db.prepare('SELECT wid, word_in_text, trailer, rid FROM words ORDER BY wid').all()
	const rows_by_rid = {}
	rows.forEach(row => {
		if (!(row.rid in rows_by_rid)) {
			rows_by_rid[row.rid] = []
		}
		const { wid, word_in_text, trailer } = row
		rows_by_rid[row.rid].push([ wid, word_in_text, trailer ])
	})
	return function* text_iterator() {
		Object.keys(rows_by_rid).forEach(key => {
			yield { rid: key, text: rows_by_rid[key] }
		})
	}
}
module.exports = {
	word_features: () => word_features,
	text_iterator: (parallel_id_object) => {
		parallel_id_object = {bhs, lxx, kjv}
	}
	word_iterator: prepare_word_iterator()
}
