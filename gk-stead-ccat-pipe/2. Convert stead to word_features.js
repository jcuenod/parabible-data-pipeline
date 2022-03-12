const { ccatParse } = require("ccat-parse")
const { betaCodeToGreek } = require("beta-code-js")
const sqlite = require("better-sqlite3")

const inputDb = new sqlite("./steadlxx.db")
const outputDb = new sqlite("./output/data.sqlite")

const INSERT_LIMIT = 25000

const patchMorphCode = code => {
	if (code === "V  AI3P") {
		// Mistake in CCAT data led to loss of "F" in Stead's data
		return "V  FAI3P"
	}

	return code
}


const unifyDuplicateSpaces = str => {
	const ret = str.replace("  ", " ")
	return (ret === str) ?
		ret :
		unifyDuplicateSpaces(ret)
}

const escapeSingleQuotes = str =>
	str.replace(/'/g, "''")



const columnsToNorm = [
	"text",
	"lexeme",
]
const normalizeGreekValues = obj => {
	const r = Object.assign({}, obj)
	columnsToNorm.forEach(k => {
		r[k] = r[k].normalize("NFC").toLowerCase()
	})
	return r
}


const words = []
const verse_texts = []

let current_verse = 1001001
let verse_text = []
let wid = 1
console.log("Transforming words...")

const handleEsdrasRid = rid =>
	Math.floor(rid / 1000000) === 16
		? rid - 10000
		: rid


const selectStmt = inputDb.prepare(`SELECT * FROM lxxmorph WHERE CAST(VersecodeLXX AS INTEGER) < 40000000`)
for (const row of selectStmt.iterate()) {
	const rid = handleEsdrasRid(+row["VersecodeLXX"])
	if (rid !== current_verse) {
		verse_texts.push([current_verse, escapeSingleQuotes(JSON.stringify(verse_text))])
		current_verse = rid
		verse_text = []
	}

	if (!row["GrkLemma"]) {
		console.log(row)
		process.exit()
	}
	const morph = unifyDuplicateSpaces(patchMorphCode(row["GrkMorphology"]))
	const word = {
		wid: wid++,
		text: betaCodeToGreek(row["DisplayText"]),
		trailer: row["Punctuation"] + " ",
	}
	const r = {
		wid,
		...word,
		lexeme: betaCodeToGreek(row["GrkLemma"]),
		...ccatParse(morph),
		// syntax_node?
		rid,
	}
	if ("case" in r) {
		r["case_"] = r["case"]
		delete r["case"]
	}
	if ("declension" in r)
		delete r["declension"]
	if ("mood" in r) {
		if (r["mood"] === "ptcp") {
			r["mood"] = "ptc"
		}
		if (r["mood"] === "infn") {
			r["mood"] = "inf"
		}
	}

	words.push(normalizeGreekValues(r))

	verse_text.push(word)
	if (words.length % INSERT_LIMIT === 0) {
		console.log("Words:", words.length)
	}
}
verse_texts.push([current_verse, escapeSingleQuotes(JSON.stringify(verse_text))])




console.log("Writing sql...")
const columnSet = new Set()
words.forEach(w => {
	Object.keys(w).forEach(k => columnSet.add(k))
})
columnSet.delete("wid")
columnSet.delete("text")
columnSet.delete("trailer")
columnSet.delete("lexeme")
columnSet.delete("rid")
const columnSetToArray = Array.from(columnSet)

const columns = [
	"wid",
	"text",
	"trailer",
	"lexeme",
	...columnSetToArray,
	"rid"
]
console.log(columns)

outputDb.exec(`
DROP TABLE IF EXISTS word_features;`)
outputDb.exec(`
CREATE TABLE word_features (
  wid INTEGER,
  text TEXT,
  trailer TEXT,
  lexeme TEXT,
${columnSetToArray.map(k => `  ${k} TEXT`).join(",\n")},
  rid INTEGER
);`)
outputDb.exec(`
DROP TABLE IF EXISTS verse_text;`)
outputDb.exec(`
CREATE TABLE verse_text (
	rid INTEGER,
	text TEXT
);`)

const insert_into_word_features = words => `
INSERT INTO word_features VALUES
${words.map(w =>
	"(" + columns.map(c =>
		w[c] ?
			Number.isInteger(w[c]) ? w[c] :
				`'${escapeSingleQuotes(w[c])}'` :
			`''`
	) + ")"
).join(",")}`
const insert_into_verse_text = values => `
INSERT INTO verse_text VALUES 
${values.map(v =>
	`(${v[0]}, '${v[1]}')`
).join(",")}`


let word_features_counter = 0
let verse_text_counter = 0
while (verse_texts.length > 0) {
	const values = verse_texts.splice(0, INSERT_LIMIT)
	const query = insert_into_verse_text(values)
	const stmt = outputDb.prepare(query)
	stmt.run()
	verse_text_counter += values.length
	console.log(verse_text_counter)
}

while (words.length > 0) {
	const values = words.splice(0, INSERT_LIMIT)
	const query = insert_into_word_features(values)
	const stmt = outputDb.prepare(query)
	stmt.run()
	word_features_counter += values.length
	console.log(word_features_counter)
}



const fs = require("fs")
const module_data = {
	"name": "Rahlfs LXX Tagged by CCAT aligned by Biblecrawler",
	"abbreviation": "CCAT LXX",
	"versification_schema": "lxx",
	"license": "Copyright © 1988 University of Pennsylvania",
	"url": "http://ccat.sas.upenn.edu/gopher/text/religion/biblical/",
	"language": "el"
}
fs.writeFileSync("./output/module.json", JSON.stringify(module_data), "utf-8")
