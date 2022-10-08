const bhsLxx = require("../parabible/bhs-lxx-alignment-modified-output.json")
const bhsToLxx = Object.fromEntries(bhsLxx.map(({ bhs, lxx }) => [bhs, lxx]))

const sqlite = require("better-sqlite3")
const inputDb = new sqlite("../biblecrawler/alignment.db")
const outputDb = new sqlite("./output/data.sqlite")

//For the NT
const ult_align_path = "../ult-rids/ult_align.sqlite"

const INSERT_LIMIT = 5000

const output = []

const stmt = inputDb.prepare(`SELECT * FROM alignment;`)
for (const row of stmt.iterate()) {
    // The first row of this table is actually header entries...
    if (Object.values(row).includes("kjv")) {
        continue
    }
    //Ignore stuff after the OT—SBL 2 lists no differences in the NT
    if (row["kjv"] && +row["kjv"] >= 40000000 ||
        row["bhs"] && +row["bhs"] >= 40000000 ||
        row["gnt"] && +row["gnt"] >= 40000000 ||
        row["lxx"] && +row["lxx"] >= 40000000 ||
        row["vul"] && +row["vul"] >= 40000000) {
        continue
    }
    Object.keys(row).forEach(k => {
        if (!row[k]) {
            row[k] = "NULL"
        }
    })
    if (!Number.isInteger(row["kjv"])) {
        /**
         * There are a few split rows in the biblecrawler data (note the "a" in the kjv column):
            009020042a,009021001,"",009021001,009020043
            011022044a,011022044,"",011022044,011022043
            013012005a,013012006,"",013012006,013012005
            019051000a,019051002,"",019050002,019050002
            019052000a,019052002,"",019051002,019051002
            019054000a,019054002,"",019053002,019053002
            019060000a,019060002,"",019059002,019059002
         */
        row["kjv"] = "NULL"
    }
    row["lxx"] = "NUll"
    if (row["bhs"] in bhsToLxx) {
        row["lxx"] = bhsToLxx[row["bhs"]]
    }
    output.push(row)
}

// const fs = require("fs")
// fs.writeFileSync("./output/alignment.json", JSON.stringify(output, null, 2), "utf8")

outputDb.exec(`
DROP TABLE IF EXISTS alignment`)
outputDb.exec(`
CREATE TABLE IF NOT EXISTS "alignment"(
    "kjv" INTEGER,
    "bhs" INTEGER,
    "gnt" INTEGER,
    "lxx" INTEGER,
    "vul" INTEGER
  );`)
const generate_insert_query = values => `
INSERT INTO alignment VALUES
${values.map(({ kjv, bhs, gnt, lxx, vul }) =>
    `\t(${kjv}, ${bhs}, ${gnt}, ${lxx}, ${vul})`
).join(",\n")}`

let counter = 0
while (output.length > 0) {
    const values = output.splice(0, INSERT_LIMIT)
    const query = generate_insert_query(values)
    outputDb.prepare(query).run()
    counter += values.length
    console.log(counter)
}


// IMPORT NT ALIGNMENT
{
    outputDb.exec(`
        ATTACH '${ult_align_path}' AS db2;
        INSERT INTO alignment (kjv,gnt) SELECT kjv,gnt FROM db2.alignment;
    `)
}

const range = size => Array.from(new Array(size)).map((_, i) => i)

// CREATE APOSTOLIC FATHERS ALIGNMENT
{
    // This provides room for the deuterocanonical stuff after the NT (there are maybe 40 books in this set)
    const ridOffset = 111
    const books = [{
        name: "Barnabas",
        versesPerChapter: [0, 7, 10, 6, 14, 14, 19, 11, 7, 8, 12, 11, 11, 7, 9, 9, 10, 2, 2, 12, 2, 9],
    }, {
        name: '1 Clement',
        versesPerChapter: [1, 3, 8, 4, 13, 6, 4, 7, 6, 4, 7, 2, 8, 4, 5, 6, 17, 6, 14, 3, 12, 9, 8, 5, 5, 5, 3, 7, 4, 3, 8, 4, 4, 8, 8, 12, 6, 5, 4, 9, 5, 4, 5, 6, 5, 8, 9, 7, 6, 6, 6, 5, 4, 5, 4, 6, 16, 7, 2, 4, 4, 3, 3, 4, 1, 2]
    }, {
        name: '2 Clement',
        versesPerChapter: [0, 8, 7, 5, 5, 7, 9, 6, 6, 11, 5, 7, 6, 4, 5, 5, 4, 7, 2, 4, 5]
    }, {
        name: "Didache",
        versesPerChapter: [0, 6, 7, 10, 14, 2, 3, 4, 3, 5, 7, 12, 5, 7, 3, 4, 8],
    }, {
        name: "Diognetus",
        versesPerChapter: [0, 1, 10, 5, 6, 17, 10, 9, 11, 6, 8, 8, 9],
    }, {
        name: "Shepherd of Hermas",
        versesPerChapter: [/* hermas is a mess - seem to be different systems... */]
    }, {
        name: 'Ignatius to the Ephesians',
        versesPerChapter: [1, 3, 2, 2, 2, 3, 2, 2, 2, 2, 3, 2, 2, 2, 2, 3, 2, 2, 2, 3, 2, 2],
    }, {
        name: 'Ignatius to the Magnesians',
        versesPerChapter: [1, 2, 1, 2, 1, 1, 2, 2, 2, 2, 3, 1, 1, 2, 1, 1],
    }, {
        name: 'Ignatius to Polycarp',
        versesPerChapter: [1, 3, 3, 2, 3, 2, 2, 3, 3],
    }, {
        name: 'Ignatius to the Romans',
        versesPerChapter: [1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3],
    }, {
        name: 'Ignatius to the Philadelphians',
        versesPerChapter: [1, 2, 1, 2, 2, 3, 2, 2, 2, 2, 2, 3, 2, 2],
    }, {
        name: 'Ignatius to the Smyrneans',
        versesPerChapter: [1, 2, 1, 2, 2, 3, 2, 2, 2, 2, 2, 3, 2, 2],
    }, {
        name: 'Ignatius to the Trallians',
        versesPerChapter: [1, 2, 3, 3, 2, 2, 2, 2, 2, 2, 1, 2, 3, 3],
    }, {
        name: 'Martyrdom of Polycarp',
        versesPerChapter: [1, 2, 4, 2, 1, 2, 2, 3, 3, 3, 2, 2, 3, 3, 3, 2, 2, 3, 3, 2, 2, 1, 4],
    }, {
        name: 'Polycarp to the Philippians',
        versesPerChapter: [1, 3, 3, 3, 3, 3, 3, 2, 2, 2, 3, 4, 3, 2, 1]
    }]



    // Now we create a rid for each book/chapter/verse combo and add it to the kjv.
    const apFathersRids = []
    books.forEach((book, i) => {
        const book_int = ridOffset + i
        book.versesPerChapter.forEach((vv, chapter) => {
            apFathersRids.push(...range(vv).map(v =>
                book_int * 1_000_000 +
                chapter * 1_000 +
                v
            ))
        })
    })

    outputDb.exec(`
        INSERT INTO alignment (kjv) VALUES
            ${apFathersRids.map(rid => `(${rid})`).join(",")}
    `)
}


outputDb.exec(`CREATE INDEX kjv_index ON alignment(kjv);`)
outputDb.exec(`CREATE INDEX bhs_index ON alignment(bhs);`)
outputDb.exec(`CREATE INDEX lxx_index ON alignment(lxx);`)
outputDb.exec(`CREATE INDEX vul_index ON alignment(vul);`)
outputDb.exec(`CREATE INDEX gnt_index ON alignment(gnt);`)
