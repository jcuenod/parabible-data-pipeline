const fs = require("fs")
const grammar = require('usfm-grammar')

const usfmToCsv = ({ input, output }) => {
	const usfmFile = fs.readFileSync(input, "utf-8")
	const myUsfmParser = new grammar.USFMParser(usfmFile, "relaxed")
	const csvString = myUsfmParser.toCSV()
	fs.writeFileSync(output, csvString, "utf-8")
}

console.log("Importing")
const usfms = fs.readdirSync("./source-files/sparvg_usfm/")
	.filter((f) => f.endsWith("usfm"))

const a = await usfms.forEach(async (filename) => {
	const input = `source-files/sparvg_usfm/${filename}`
	const output = `csv-files/${filename.replace("usfm", "csv")}`
	try {
		fs.statSync(output)
		console.log(output, "cached")
	} catch (e) {
		usfmToCsv({ input, output })
		console.log(output, "done")
	}
})



const sqlite = require("better-sqlite3")
const db = new sqlite("./output/data.sqlite")
db.exec(`
DROP TABLE IF EXISTS verse_text;`)
db.exec(`
CREATE TABLE verse_text (
	rid INTEGER,
	text TEXT
);`)
const insert_into_verse_text = (values) => `
INSERT INTO verse_text VALUES 
${values.map((v) => `(${v[0]}, '${v[1].replace(/'/g, "''")}')`).join(",")}`

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

const csvs = fs.readdirSync("./csv-files/").filter((f) => f.endsWith(".csv"))
csvs.forEach((filename) => {
	console.log(filename)
	const content = loadCsvFile(`csv-files/${filename}`)
	// Skip the first line (header)
	const csvOutput = content
		.slice(1)
		.map(([book, chapter, verse, text]) => [
			getRid({ book, chapter, verse }),
			text,
		])
		.filter(([rid, text]) => rid > 0 && !!text)
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
	name: "Santa Biblia Reina Valera Gómez",
	abbreviation: "RVG",
	versification_schema: "kjv",
	license: "Copyright © 2004, 2010 Dr. Humberto Gómez Caballero",
	url: "https://ebible.org/details.php?id=sparvg",
}
fs.writeFileSync("./output/module.json", JSON.stringify(module_info), "utf8")
