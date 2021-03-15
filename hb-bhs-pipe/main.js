const fs = require("fs")
const exec = require("child_process").execSync

const sqlOutputFile = `${__dirname}/output/data.sqlite`
const jsonOutputFile = `${__dirname}/output/word_features.json`

console.log("Checking for prepopulated sqlite")
if (!fs.existsSync(sqlOutputFile) || !fs.existsSync(jsonOutputFile)) {
	console.log(" - Does not exist, generating...")

	let result
	console.log(" - - Installing text-fabric")
	result = exec("pip install text-fabric --user")
	console.log(" - - Creating sqlite (will take a while)")
	console.log(` - - python './1. create_sql_from_tf.py' ${sqlOutputFile} ${jsonOutputFile}`)
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

const prepare_word_iterator = ({node_offset}) => {
	console.log("Selecting BHS words...")
	const rows = db.prepare('SELECT * FROM words').all()
	function* word_iterator() {
		for (let i = 0; i < rows.length; i++) {
			rows[i].wid += node_offset
			rows[i].phrase_node_id += node_offset
			rows[i].clause_node_id += node_offset
			rows[i].sentence_node_id += node_offset
			rows[i].verse_node_id += node_offset
			yield rows[i]
		}
	}
	return word_iterator
}
const prepare_text_iterator = ({ node_offset, get_parallel_id_from_rid_and_version }) => {
	const rows = db.prepare('SELECT wid, text, trailer, rid FROM words ORDER BY wid').all()
	const rows_by_rid = {}
	rows.forEach(row => {
		const rid = row.rid
		if (!(rid in rows_by_rid)) {
			rows_by_rid[rid] = []
		}
		const { wid, text, trailer } = row
		rows_by_rid[rid].push([ wid+node_offset, text, trailer ])
	})
	function* text_iterator() {
		const rows_by_rid_keys = Object.keys(rows_by_rid) 
		for (let i = 0; i < rows_by_rid_keys.length; i++) {
			const key = rows_by_rid_keys[i]
			const parallel_id = get_parallel_id_from_rid_and_version({rid: key, version: "bhs"})
			// Sort can be i because this iterates in order of wid based on the SELECT above
			yield { parallel_id, text: rows_by_rid[key], sort: i }
		}
	}
	return text_iterator
}
module.exports = {
	word_features: word_features,
	text_iterator: prepare_text_iterator,
	word_iterator: prepare_word_iterator
}
