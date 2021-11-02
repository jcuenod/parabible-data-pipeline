const { execSync } = require("child_process")

const sqlOutputFile = __dirname + "/cache/data.sqlite"
const jsonOutputFile = __dirname + "/cache/word_features.json"

execSync(`
    python scripts/create_sql_from_tf.py ${sqlOutputFile} ${jsonOutputFile}
`)

const sqlite = require("better-sqlite3")
const db = sqlite(sqlOutputFile)

console.log("DOING TRANSLITERATION")
const addTransliteration = require("./scripts/augment_with_transliteration")
addTransliteration(db)

console.log("DOING LEXEME DEDUPLICATION")
const deduplicateLexemes = require("./scripts/deduplicate_lexemes.js")
deduplicateLexemes(db)

console.log("ADDING VERSE_TEXT")
const addVerseText = require("./scripts/augment_data_with_verse_text")
addVerseText(db)

const fs = require("fs")

// Copy data.sqlite to the output directory
fs.copyFileSync(sqlOutputFile, __dirname + "/output/data.sqlite")

// Write out module_data json file
const module_data = {
    "name": "Tagged BHS with Syntax Trees",
    "abbreviation": "ETCBC BHSA",
    "versification_schema": "bhs",
    "license": "Attribution-NonCommercial 4.0 International (<a href='https://creativecommons.org/licenses/by-nc/4.0/'>CC BY-NC 4.0</a>)",
    "url": "http://dx.doi.org/10.17026%2Fdans-z6y-skyh",
    "language": "he"
}
fs.writeFileSync("./output/module.json", JSON.stringify(module_data), "utf-8")