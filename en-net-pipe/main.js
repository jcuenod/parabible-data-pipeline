const fs = require("fs")
const grammar = require('usfm-grammar')
const c2a = require("csv2array")

const sourceFolder = "./source-files/engnet_usfm/"
const INSERT_LIMIT = 5000

const usfmToCsv = async ({ input, output }) => {
	const usfmFile = (await fs.promises.readFile(input, 'utf-8'))
	const myUsfmParser = new grammar.USFMParser(usfmFile, "relaxed")
	const csvString = myUsfmParser.toCSV()
	await fs.promises.writeFile(output, csvString, "utf-8")
}

const fileStringFromPath = (filename) => fs.readFileSync(filename, "utf-8")
const loadCsvFile = (filename) => c2a(fileStringFromPath(filename))

console.log("Importing")
const usfms = fs.readdirSync(sourceFolder)
	.filter((f) => f.endsWith("usfm"))

console.log("Converting to csv. May take 5min...")
Promise.all(usfms.map(async filename => {
	const input = sourceFolder + filename
	const output = `./csv-files/${filename.replace(".usfm", ".csv")}`
	try {
		fs.statSync(output)
		console.log("cached:", output)
	}
	catch (e) {
		console.log("CONVERT:", output)
		await usfmToCsv({ input, output })
	}
}))
	.then(() => {
		console.log("done")
		createModuleFromCsvs()
	})
	.catch(err => {
		console.error(err)
	})


const createModuleFromCsvs = () => {
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
		"name": "New English Translation",
		"abbreviation": "NET",
		"description": "The NET Bible is a completely new translation of the Bible, not a revision or an update of a previous English version.",
		"corpora": ["OT", "NT"],
		"versification_schema": "kjv",
		"license": "Copyright ©1996-2016 by Biblical Studies Press, L.L.C. All rights reserved.",
		"url": "https://netbible.com/",
		"language": "en",
	}
	fs.writeFileSync("./output/module.json", JSON.stringify(module_info), "utf8")
}

