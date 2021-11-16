const fs = require("fs")
const c2a = require("csv2array")
const usfmToCsv = require("./usfm-to-csv")

const INSERT_LIMIT = 5000

const fileStringFromPath = (filename) => fs.readFileSync(filename, "utf8")
const loadCsvFile = filename => c2a(fileStringFromPath(filename))
// Process lines individually to isolate problems in the csv
// const csvToJson = filename => {
// 	const lines = fileStringFromPath(filename)
// 	const r = c2a(lines)
// 	console.log(r)
// 	return r
// }


console.log("Importing")
const usfms = fs.readdirSync("./source-repository/").filter((f) => f.endsWith("usfm"))
usfms.forEach((filename) => {
	const input = `source-repository/${filename}`
	const output = `csv-files/${filename.replace("usfm", "csv")}`
	try {
		fs.statSync(output)
		console.log(output, "cached")
	}
	catch (e) {
		usfmToCsv({ input, output })
		console.log(output, "done")
	}
})


const escapeQuotes = str => str.replace(/'/g, "''")
const htmlLinebreaks = str => str.replace(/\s*\\n\s*/g, "<br />")

const sqlite = require("better-sqlite3")
const db = new sqlite("./output/data.sqlite")
db.exec(`
DROP TABLE IF EXISTS verse_text;`)
db.exec(`
CREATE TABLE verse_text (
	rid INTEGER,
	text TEXT
);`)
const insert_into_verse_text = values => `
INSERT INTO verse_text VALUES 
${values.map(v =>
	`(${v[0]}, '${escapeQuotes(htmlLinebreaks(v[1]))}')`
).join(",")}`


const ReferenceParser = require("referenceparser").default
const rp = new ReferenceParser()
const bookDetails = require("./bookDetails.json")
const _getBookInt = (book) => {
	const i = bookDetails.findIndex((d) => d.name === book) + 1
	if (i < 0) {
		throw "Couldn't find book"
	} else {
		return i
	}
}
const generateRid = (reference) => {
	const book = _getBookInt(reference.book) * 1000000
	const ch = reference.chapter * 1000
	const v = reference.hasOwnProperty("verse") ? reference.verse : 0
	return book + ch + v
}
const getRid = ({ book, chapter, verse }) =>
	generateRid(rp.parse(`${book} ${chapter}:${verse}`))

const csvs = fs.readdirSync("./csv-files/").filter(f => f.endsWith(".csv"))
csvs.forEach(filename => {
	console.log(filename)
	const content = loadCsvFile(`csv-files/${filename}`)
	// Skip the first line (header)
	const csvOutput = content.slice(1).map(([book, chapter, verse, text]) =>
		[getRid({ book, chapter, verse }), text]
	).filter(([rid, text]) => rid > 0 && !!text)
	console.log(" ... verses:", csvOutput.length)
	while (csvOutput.length > 0) {
		const values = csvOutput.splice(0, INSERT_LIMIT)
		const query = insert_into_verse_text(values)
		const stmt = db.prepare(query)
		stmt.run()
	}
	console.log(" ... done")
})
console.log("done")

const module_info = {
	"name": "unfoldingWord® Simplified Text",
	"abbreviation": "UST",
	"versification_schema": "kjv",
	"license": "CC-BY-SA",
	"url": "https://www.unfoldingword.org/ust"
}
fs.writeFileSync("./output/module.json", JSON.stringify(module_info), "utf8")
