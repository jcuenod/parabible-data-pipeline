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
    "LICENSE",
    "docs",
    "scripts",
    ".git",
    // TODO: Just for now
    "013-shepherd.en.csv",
    "tmp"
]

const normalizeQuotes = (text) => {
    // Replace single quotes with double quotes
    const singleQuoteRegex = /['‘’`]/g;
    let normalizedText = text.replace(singleQuoteRegex, '"');
  
    // Replace angled Unicode quotes with double quotes
    const angleQuoteRegex = /[“”]/g;
    return normalizedText.replace(angleQuoteRegex, '"');
  };

const files = fs.readdirSync("./source-files").filter(f => !IGNORE_LIST.includes(f))

const getRef = (book, chv) => {
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

    const refString = book + " " + chv
    const reference = rp.parse(refString)
    if (!reference.book) {
        console.error(refString)
        throw (`fail`)
    }
    return refToRid(reference)
}

const idAndTextFromLine = (line, book) => {
    const firstSpaceIndex = line.indexOf(' ');
    const firstPart = line.slice(0, firstSpaceIndex);
    const secondPart = line.slice(firstSpaceIndex + 1);
    const ref = getRef(book, firstPart)
    if (!ref) return null
    return [ref, normalizeQuotes(secondPart)];
}

console.log("Parsing Files:")
const allLines = []
files.forEach(f => {
    console.log(" -", f)
    const book = f.substring(4, f.length - 7)
    if (book === "shepherd") {
        // TODO: Skip shepherd for now
        return
    }
    const lines = fs.readFileSync("./source-files/" + f, "utf8").split("\n")
    const idAndTextFromLineForBook = (line) => idAndTextFromLine(line,book)
    const splitLines = lines.map(idAndTextFromLineForBook).filter(a => !!a)
    allLines.push(...splitLines)
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
    `(${v[0]}, '${escape(v[1])}')`
).join(",")}`
while (allLines.length > 0) {
    const toInsert = allLines.splice(0, INSERT_LIMIT)
    const stmt = generateVTInsertStatement(toInsert)
    outputDb.exec(stmt)
}
console.log(" - Done")

const module_data = {
    "abbreviation": "CAFE", // i.e., "Contemporary Apostolic Fathers Edition"
    "name": "Contemporary Apostolic Fathers Edition (English)",
    "description": "Contemporary Apostolic Fathers Edition in English. Edited by James Cuénod.",
    "corpora": ["ApF"],
    "language": "en",
    "versification_schema": "kjv",
    "license": "CC BY-SA",
    "url": "https://github.com/jcuenod/CAFE",
}
fs.writeFileSync("./output/module.json", JSON.stringify(module_data), "utf-8")
