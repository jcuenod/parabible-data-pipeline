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


outputDb.exec(`CREATE INDEX kjv_index ON alignment(kjv);`)
outputDb.exec(`CREATE INDEX bhs_index ON alignment(bhs);`)
outputDb.exec(`CREATE INDEX lxx_index ON alignment(lxx);`)
outputDb.exec(`CREATE INDEX vul_index ON alignment(vul);`)
outputDb.exec(`CREATE INDEX gnt_index ON alignment(gnt);`)