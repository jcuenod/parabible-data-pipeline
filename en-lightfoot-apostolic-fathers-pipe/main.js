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
    "Ignatius to the Philadelphians",
    "Ignatius to Polycarp",
    "Ignatius to the Romans",
    "Ignatius to the Smyrneans",
    "Ignatius to the Trallians",
    "Martyrdom of Polycarp",
    "Polycarp to the Philippians",
]

const refToRid = ref => {
    const book_int = RID_OFFSET + BOOK_ORDER.indexOf(ref.book)
    return book_int * 1000000 +
        ref.chapter * 1000 +
        ref.verse
}

const outputDb = new sqlite("./output/data.sqlite")
outputDb.exec(`
DROP TABLE IF EXISTS verse_text;`)
outputDb.exec(`
CREATE TABLE verse_text (
	rid INTEGER,
	text TEXT
);`)

const escape = str => str.replace(/'/g, "''")
const generateInsertStatement = values => `
INSERT INTO verse_text VALUES 
${values.map(v =>
    `(${v[0]}, '${escape(v[1])}')`
).join(",")}`


const IGNORE_LIST = [
    "README.md",
    ".git",
    // TODO: Just for now
    "Hermas"
]

const files = fs.readdirSync("./source-files").filter(f => !IGNORE_LIST.includes(f))

console.log("Parsing Files:")
const toInsert = []
files.forEach(f => {
    console.log(" -", f)
    const paragraphsWithHeader = fs.readFileSync(`./source-files/${f}`, "utf8").split("\n\n").filter(p => !!p)
    const paragraphs = paragraphsWithHeader.slice(1)

    paragraphs.forEach((p, i) => {
        const lines = p.trim().split("\n")
        const ref = lines[0].endsWith("prologue:1")
            ? rp.parse(lines[0].slice(0, lines[0].length - "prologue:1".length))
            : rp.parse(lines[0])
        if (lines[0].endsWith("prologue:1")) {
            ref.verse = 1
        }
        const rid = refToRid(ref)
        if (i === 0) {
            console.log(" - ", ref, rid)
        }
        const content = lines.slice(1).join(" ")

        if (rid === 110000000 || Number.isNaN(rid)) {
            console.error(`Could not parse ${lines[0]}`)
            throw ("nan")
        }

        toInsert.push([
            rid,
            content.trim()
        ])
    })
})
console.log(" - Done")

while (toInsert.length > 0) {
    const doInsert = toInsert.splice(0, INSERT_LIMIT)
    const stmt = generateInsertStatement(doInsert)
    outputDb.exec(stmt)
}

const module_data = {
    "abbreviation": "LAPF",
    "name": "Apostolic Fathers (Lightfoot's Translation)",
    "description": "Lightfoot's English translation of the Apostolic Fathers Digitized from CCAT",
    "corpora": ["ApF"],
    "language": "en",
    "versification_schema": "kjv",
    "license": "Adapted and Modified © 1990 ATHENA DATA PRODUCTS",
    "url": "https://ccat.sas.upenn.edu/gopher/text/religion/churchwriters/ApostolicFathers/",
}
fs.writeFileSync("./output/module.json", JSON.stringify(module_data), "utf-8")
