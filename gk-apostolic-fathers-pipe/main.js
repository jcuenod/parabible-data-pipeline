const csv2array = require("csv2array")
const sqlite = require("better-sqlite3")
const INSERT_LIMIT = 5000

const fs = require("fs")
const ReferenceParser2 = require("/home/jcuenod/Programming/ReferenceParser/lib/index.js")
const rp = new ReferenceParser2.default()

const RID_OFFSET = 111
const BOOK_ORDER = [
    "Barnabas",
    "1 Clement",
    "2 Clement",
    "Didache",
    "Diognetus",
    "Shepherd of Hermas",
    "Ignatius to the Ephesians",
    "Ignatius to the Magnesians",
    "Ignatius to the Phila",
    "Ignatius to Polycarp",
    "Ignatius to the Romans",
    "Ignatius to the Philadelphians",
    "Ignatius to the Smyrneans",
    "Ignatius to the Trallians",
    "Martyrdom of Polycarp",
    "Polycarp to the Philippians",
]

const refToRid = ref => {
    const book_int = RID_OFFSET + BOOK_ORDER.indexOf(ref.book)
    if (book_int === RID_OFFSET - 1) {
        console.error(ref)
        throw ("fail")
    }
    return book_int * 1000000 +
        ref.chapter * 1000 +
        ref.verse
}

const outputDb = new sqlite("./output/data.sqlite")

const IGNORE_LIST = [
    "README.md",
    ".git",
    // TODO: Just for now
    "013-shepherd.csv",
    "tmp"
]

const files = fs.readdirSync("./source-files").filter(f => !IGNORE_LIST.includes(f))

let wordCounter = 1
console.log("Parsing Files:")
const wordInsert = []
const verseTextObjects = []
files.forEach(f => {
    console.log(" -", f)
    const book = f.substring(4, f.length - 4)
    console.log(book, rp.parse(book))
    const lines = fs.readFileSync("./source-files/" + f, "utf8")
    const rows = csv2array(lines)
    // First row is [ reference,leader,word,trailer,lemma ],
    rows.slice(1).forEach(row => {
        const [chv, leader, text, trailerWithoutSpace, lexeme] = row

        // TODO: Fix handling of these unusual chapters
        if (book === "i_clement" && chv.startsWith("SB.")) {
            return
        }
        if (book === "barnabas" && chv.startsWith("SB.")) {
            return
        }
        if (book === "martyrdom" && chv.startsWith("EP.")) {
            return
        }

        const trailer = trailerWithoutSpace + " "
        const refString = book + " " + chv
        const reference = rp.parse(refString)
        if (!reference.book) {
            console.error(refString)
            throw (`fail`)
        }
        const rid = refToRid(reference)
        const wid = wordCounter++
        wordInsert.push({ wid, leader, text, trailer, lexeme, rid })
        if (!(rid in verseTextObjects)) {
            verseTextObjects[rid] = []
        }
        verseTextObjects[rid].push({
            wid,
            leader,
            text,
            trailer
        })
    })
})

const escape = str => str.replace(/'/g, "''")

console.log("Beginning Insertion (verseText):")
outputDb.exec(`
DROP TABLE IF EXISTS verse_text;`)
outputDb.exec(`
CREATE TABLE verse_text (
	rid INTEGER,
	text TEXT
);`)
const generateVTInsertStatement = values => `
INSERT INTO verse_text VALUES 
${values.map(v =>
    `(${v[0]}, '${JSON.stringify(v[1])}')`
).join(",")}`
const rids = Object.keys(verseTextObjects)
while (rids.length > 0) {
    const toInsert = rids.splice(0, INSERT_LIMIT)
    const stmt = generateVTInsertStatement(toInsert.map(rid => [rid, verseTextObjects[rid]]))
    outputDb.exec(stmt)
}
console.log(" - Done")

console.log("Beginning Insertion (wordFeatures):")
outputDb.exec(`
DROP TABLE IF EXISTS word_features;`)
outputDb.exec(`
CREATE TABLE word_features (
	wid INTEGER,
    leader TEXT,
    text TEXT,
    trailer TEXT,
    lexeme TEXT,
    rid INTEGER
);`)
const generateWTInsertStatement = values => `
INSERT INTO word_features VALUES 
${values.map(v =>
    `(${v.wid}, '${escape(v.leader)}', '${escape(v.text)}', '${escape(v.trailer)}', '${escape(v.lexeme)}', ${v.rid})`
).join(",")}`
while (wordInsert.length > 0) {
    const toInsert = wordInsert.splice(0, INSERT_LIMIT)
    const stmt = generateWTInsertStatement(toInsert)
    outputDb.exec(stmt)
}
console.log(" - Done")


const module_data = {
    "name": "Apostolic Fathers (Original)",
    "abbreviation": "ApFathers",
    "versification_schema": "kjv",
    "license": "???",
    "url": "",
    "language": "el"
}
fs.writeFileSync("./output/module.json", JSON.stringify(module_data), "utf-8")
