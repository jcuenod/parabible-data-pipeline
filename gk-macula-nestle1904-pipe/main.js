const csv = require('csv-parser');
const fs = require("fs")
const sqlite = require("better-sqlite3")
const grc = require("greek-transliteration");
const ReferenceParser = require("referenceparser").default
const rp = new ReferenceParser()

const SOURCE_FILE = "source-files/Nestle1904/TSV/macula-greek.tsv"
const BATCH_SIZE = 10000

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

const db = new sqlite("./output/data.sqlite")
db.exec(`
DROP TABLE IF EXISTS verse_text;`)
db.exec(`
CREATE TABLE verse_text (
    rid INTEGER,
    text TEXT
);`)
db.exec(`
DROP TABLE IF EXISTS word_features;`)

const morphMap = {
    part_of_speech: {
        noun: "noun",
        verb: "verb",
        det: "art", // this is the only one that matters
        conj: "conj",
        pron: "pron",
        prep: "prep",
        adj: "adj",
        adv: "adv",
        ptcl: "ptcl",
        num: "num",
        intj: "intj",
    },
    tense: {
        "present": "pres",
        "imperfect": "impf",
        "future": "fut",
        "aorist": "aor",
        "perfect": "perf",
        "pluperfect": "plupf",
    },
    voice: {
        "active": "act",
        "middle": "mid",
        "middlepassive": "mid-pass",
        "passive": "pass",
    },
    mood: {
        "indicative": "ind",
        "imperative": "impv",
        "subjunctive": "subj",
        "optative": "opt",
        "infinitive": "inf",
        "participle": "ptc",
    },
    person: {
        "first": "1",
        "second": "2",
        "third": "3",
    },
    number: {
        "singular": "sg",
        "plural": "pl",
    },
    gender: {
        "masculine": "masc",
        "feminine": "fem",
        "neuter": "neut",
    },
    case: {
        "nominative": "nom",
        "genitive": "gen",
        "dative": "dat",
        "accusative": "acc",
        "vocative": "voc",
    },

}

console.log("Reading TSV file...")

const words = []
fs.createReadStream(SOURCE_FILE)
    .pipe(csv({ separator: "\t", quote: '"' }))
    .on('data', (data) => {
        words.push({
            wid: words.length + 1,
            leader: "",
            text: data["text"],
            trailer: data["after"],
            part_of_speech: morphMap.part_of_speech[data["class"]] || "",
            lexeme: data["lemma"],
            gloss: data["gloss"],
            tense: morphMap.tense[data["tense"]] || "",
            voice: morphMap.voice[data["voice"]] || "",
            mood: morphMap.mood[data["mood"]] || "",
            person: morphMap.person[data["person"]] || "",
            number: morphMap.number[data["number"]] || "",
            gender: morphMap.gender[data["gender"]] || "",
            case_: morphMap.case[data["case"]] || "",
            louw_nida: data["ln"],
            transliteration: grc.transliterate(data["text"]),
            rid: generateRid(data.ref.split("!")[0]),
        })
    })
    .on('end', () => {
        // Get all features from words
        console.log("Getting features...")
        const features = new Set()
        for (const word of words) {
            for (const feature of Object.keys(word)) {
                features.add(feature)
            }
        }
        features.delete("wid")
        features.delete("rid")

        // Create table with all features
        db.exec(`
        CREATE TABLE word_features (
            wid INTEGER,
            ${Array.from(features).map(f => `${f} TEXT`).join(",\n")},
            rid INTEGER
        );`)

        console.log("Gettings verse text...")
        const verseText = {}
        for (const word of words) {
            if (!(word.rid in verseText)) {
                verseText[word.rid] = []
            }
            verseText[word.rid].push({
                wid: word.wid,
                leader: word.leader,
                text: word.text,
                trailer: word.trailer,
            })
        }

        // Batch insert word features
        const insert = db.prepare(`
        INSERT INTO word_features (
            wid,
            ${Array.from(features).join(",\n")},
            rid
        ) VALUES (
            @wid,
            ${Array.from(features).map(f => `@${f}`).join(",\n")},
            @rid
        );`)
        const insertMany = (words) => {
            db.transaction((words) => {
                for (const word of words) insert.run(word)
            })(words)
        }
        while (words.length > 0) {
            console.log(words.length)
            const batch = words.splice(0, BATCH_SIZE)
            insertMany(batch)
        }

        // Batch insert verse text
        console.log("Inserting verse text...")
        const insertVerseText = db.prepare(`
        INSERT INTO verse_text VALUES (
            @rid,
            @text
        );`)
        const insertVerseTextMany = (verse_texts) => {
            db.transaction((verse_texts) => {
                for (const verse_text of verse_texts) insertVerseText.run(verse_text)
            })(verse_texts)
        }
        const rids = Object.keys(verseText).sort((a, b) => a - b)
        while (rids.length > 0) {
            console.log(rids.length)
            const ridList = rids.splice(0, BATCH_SIZE)
            const verses = ridList.map(rid => ({
                rid: rid,
                text: JSON.stringify(verseText[rid].sort((a, b) => a.wid - b.wid)),
            }))
            insertVerseTextMany(verses)
        }

        console.log("\nWriting module data...")
        const module_data = {
            "name": "Macula Nestle Aland 1904",
            "abbreviation": "NA1904",
            "versification_schema": "gnt",
            "license": "Public Domain",
            "url": "https://github.com/Clear-Bible/macula-greek",
            "language": "el",
        }
        fs.writeFileSync("./output/module.json", JSON.stringify(module_data), "utf-8")

        console.log("\nDone")
    })

