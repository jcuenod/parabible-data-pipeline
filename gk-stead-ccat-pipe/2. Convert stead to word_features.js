const { ccatParse } = require("ccat-parse")
const { betaCodeToGreek } = require("beta-code-js")
const sqlite = require("sqlite3")

const INSERT_LIMIT = 5000
const db = new sqlite.Database("./steadlxx.db")

const unifyDuplicateSpaces = str => {
	const ret = str.replace("  ", " ")
	return (ret === str) ?
		ret :
		unifyDuplicateSpaces(ret)
}

const escapeSingleQuotes = str =>
	str.replace(/'/g, "''")



const words = []
const verse_texts = [];

(new Promise((resolve, reject) => {
	let current_verse = 1001001
	let verse_text = []
	let wid = 0
	console.log("Reading words...")
	// lxxmorph also has a bunch of apocryphal stuff so "< 40000000" excludes
	db.each(`SELECT * FROM lxxmorph WHERE VersecodeLXX < 40000000`, (err, row) => {
		const rid = +row["VersecodeLXX"]
		if (rid !== current_verse) {
			verse_texts.push([current_verse, escapeSingleQuotes(JSON.stringify(verse_text))])
			current_verse = rid
			verse_text = []
		}

		if (!row["GrkLemma"]) {
			console.log(row)
			process.exit()
		}
		const morph = unifyDuplicateSpaces(row["CCATMorphology"])
		const word = {
			wid: wid++,
			text: betaCodeToGreek(row["DisplayText"]),
			trailer: row["Punctuation"] + " ",
		}
		const r = {
			wid,
			...word,
			realized_lexeme: betaCodeToGreek(row["GrkLemma"]),
			...ccatParse(morph),
			// syntax_node?
			rid,
		}
		if ("declension" in r)
			delete r["declension"]
		words.push(r)
		verse_text.push(word)
		if (words.length % INSERT_LIMIT === 0) {
			console.log("Words:", words.length)
		}
	}, () => {
		verse_texts.push([current_verse, escapeSingleQuotes(JSON.stringify(verse_text))])
		resolve()
	})
})).then(() => new Promise((resolve, reject) => {

	console.log("Producing output...")
	const columnSet = new Set()
	words.forEach(w => {
		Object.keys(w).forEach(k => columnSet.add(k))
	})
	columnSet.delete("wid")
	columnSet.delete("text")
	columnSet.delete("trailer")
	columnSet.delete("realized_lexeme")
	columnSet.delete("rid")
	const columnSetToArray = Array.from(columnSet)

	const columns = [
		"wid",
		"text",
		"trailer",
		"realized_lexeme",
		...columnSetToArray,
		"rid"
	]


	const drop_table_word_features = `
DROP TABLE IF EXISTS word_features;`
	const create_table_word_features = `
CREATE TABLE word_features (
  wid INTEGER,
  text TEXT,
  trailer TEXT,
  realized_lexeme TEXT,
${columnSetToArray.map(k => `  _${k} TEXT`).join(",\n")},
  rid INTEGER
);`
	const drop_table_verse_text = `
DROP TABLE IF EXISTS verse_text;`
	const create_table_verse_text = `
CREATE TABLE verse_text (
	rid INTEGER,
	text TEXT
);`

	const insert_into_word_features = words => `
INSERT INTO word_features VALUES
${words.map(w =>
		"(" + columns.map(c => `"${w[c] || ""}"`) + ")"
	).join(",")}`
	const insert_into_verse_text = values => `
INSERT INTO verse_text VALUES 
${values.map(v =>
		`(${v[0]}, '${v[1]}')`
	).join(",")}`


	let word_features_counter = 0
	let verse_text_counter = 0
	db.serialize(() => {
		console.log(create_table_word_features)
		db.run(drop_table_word_features)
		db.run(create_table_word_features)
		db.run(drop_table_verse_text)
		db.run(create_table_verse_text)

		while (words.length > 0) {
			const values = words.splice(0, INSERT_LIMIT)
			const query = insert_into_word_features(values)
			db.run(query)
			word_features_counter += values.length
			console.log(word_features_counter)
		}
		while (verse_texts.length > 0) {
			const values = verse_texts.splice(0, INSERT_LIMIT)
			const query = insert_into_verse_text(values)
			console.log(query)
			db.run(query)
			verse_text_counter += values.length
			console.log(verse_text_counter)
		}
		resolve()
	})
})).then(() => {
	db.close()
})