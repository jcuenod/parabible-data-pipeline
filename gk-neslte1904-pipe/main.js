const sqlite = require("better-sqlite3")
const outputDb = new sqlite("./output/data.sqlite")

const INSERT_LIMIT = 25000
const escapeSingleQuotes = str =>
    str.replace(/'/g, "''")

const fs = require("fs")
const csvFile = "./Nestle1904/morph/Nestle1904.csv"
const lines = fs.readFileSync(csvFile, "utf8").split("\r\n")
const header = lines.shift().split("\t")
const nestle1904 = lines.filter(l => l.length > 0).map(l => l.split("\t"))

// Fix Matt 10:28
{
    // This reveals that Matt 10:28 is not the format we would expect
    // const error = nestle1904.filter(n => n.length !== 8)
    // console.log(error)
    // => ['Matt 10:28','φοβεῖσθε','V-PEM-2P@@V-PNM-2P','V-PEM-2P@@V-PNM-2P','5399','φοβέω','φοβεῖσθε','V-PEM-2P','V-PNM-2P']
    // Solution:
    const i = nestle1904.findIndex(l => l[2] === 'V-PEM-2P@@V-PNM-2P')
    nestle1904[i] = ['Matt 10:28', 'φοβεῖσθε', 'V-PEM-2P', 'V-PNM-2P', '5399', 'φοβέω', 'φοβεῖσθε', '']
}

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
const generateRid = (referenceString) => {
    const reference = rp.parse(referenceString)
    const book = _getBookInt(reference.book) * 1000000
    const ch = reference.chapter * 1000
    const v = reference.hasOwnProperty("verse") ? reference.verse : 0
    return book + ch + v
}


console.log("Building word list...")
const punctuationMatch = /^([—\[\(]*)([\u0370-\u03FF\u1F00-\u1FFF]+)([’·.,()—\]]*)$/

let currentRid = 0
const verse_texts = []
const words_features = []
const parse = require("./util/form_morph_codes.json")
const cols = new Set([].concat(...Object.keys(parse).map(k => Object.keys(parse[k]))))
cols.delete("case")
cols.add("case_")
nestle1904.forEach(([referenceString, punctuatedWord, funcMorph, formMorph, strongs, lemma, normalized], i) => {
    const simpleGreek = punctuationMatch.test(punctuatedWord)
    if (!simpleGreek) {
        console.log(referenceString, punctuatedWord)
        process.exit()
    }
    const [_, leader, text, trailingPunc] = punctuatedWord.match(punctuationMatch)

    const wid = i + 1
    const trailer = trailingPunc + " "
    const rid = generateRid(referenceString)
    if (rid !== currentRid) {
        currentRid = rid
        verse_texts.push([currentRid, []])
    }
    const parsing = parse[formMorph]
    delete parsing["tag"]
    if ("case" in parsing) {
        parsing["case_"] = parsing["case"]
        delete parsing["case"]
    }
    const word = {
        wid,
        leader,
        text,
        trailer,
        realized_lexeme: lemma,
        ...parsing,
        rid
    }

    words_features.push(word)
    verse_texts[verse_texts.length - 1][1].push({ wid, leader, text, trailer })
})

console.log(" - words:", words_features.length)
console.log(" - verses:", verse_texts.length)
// console.log(verse_texts.slice(1000, 1010))

console.log("\nBuilding DB...")
// Set up sqlite for insertion
const columns = [
    "wid",
    "leader",
    "text",
    "trailer",
    "realized_lexeme",
    ...cols,
    "rid"
]
outputDb.exec(`
DROP TABLE IF EXISTS word_features;`)
outputDb.exec(`
CREATE TABLE word_features (
  wid INTEGER,
  leader TEXT,
  text TEXT,
  trailer TEXT,
  realized_lexeme TEXT,
${Array.from(cols).map(k => `  ${k} TEXT`).join(",\n")},
  rid INTEGER
);`)
outputDb.exec(`
DROP TABLE IF EXISTS verse_text;`)
outputDb.exec(`
CREATE TABLE verse_text (
	rid INTEGER,
	text TEXT
);`)

console.log(" - VERSE TEXTS")
const insert_into_verse_text = values => `
INSERT INTO verse_text VALUES 
${values.map(v =>
    `(${v[0]}, '${escapeSingleQuotes(JSON.stringify(v[1]))}')`
).join(",")}`
while (verse_texts.length > 0) {
    const values = verse_texts.splice(0, INSERT_LIMIT)
    const query = insert_into_verse_text(values)
    const stmt = outputDb.prepare(query)
    stmt.run()
    console.log(" -- verses to go:", verse_texts.length)
}

console.log(" - WORD FEATURES")
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
// Insert words
while (words_features.length > 0) {
    const values = words_features.splice(0, INSERT_LIMIT)
    const query = insert_into_word_features(values)
    const stmt = outputDb.prepare(query)
    stmt.run()
    console.log(" -- words to go:", words_features.length)
}


console.log("\nWriting module data...")
const module_data = {
    "name": "Nestle Aland 1904",
    "abbreviation": "Nestle1904",
    "versification_schema": "gnt",
    "license": "Public Domain",
    "url": "https://github.com/biblicalhumanities/Nestle1904/"
}
fs.writeFileSync("./output/version.json", JSON.stringify(module_data), "utf-8")

console.log("\nDone")