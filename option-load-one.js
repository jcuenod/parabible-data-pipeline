const sqlite = require("better-sqlite3")

// Getting module to load
const moduleToLoad = process.argv[3]
if (!moduleToLoad) {
    console.log("Expected module to load, got nothing.")
    console.log("--load-one hb-bhsa-pipe")
    process.exit()
}

const fs = require("fs")
const checks = [
    {
        name: "Module data exists",
        f: m => fs.existsSync(`./${moduleToLoad}/output/data.sqlite`),
    },
    {
        name: "Module data exists",
        f: m => fs.existsSync(`./${moduleToLoad}/output/version.json`),
    }
]
checks.reduce((a, v) => {
    const success = v.f(moduleToLoad)
    if (!success) {
        console.log("Failed Check:", v.name)
    }
    return a && success
}, true)

console.log("Now figure out alignment stuff (so load stuff from the active pg db)")
process.exit()





const Client = require("pg-native")
const pg = new Client()
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:toor@127.0.0.1:5432/parabibledb"
pg.connectSync(DATABASE_URL)




console.log("\nGetting schemas")
// Get available versification schemas
const alignmentStmts = {}
const schemaRowStmt = alignmentDb.prepare(`SELECT * FROM alignment LIMIT 1;`)
const schemaRow = schemaRowStmt.get()
const availableVersificationSchemas = new Set(Object.keys(schemaRow))
availableVersificationSchemas.forEach(k => {
	alignmentStmts[k] = alignmentDb.prepare(`SELECT * FROM alignment WHERE ${k} = ?`)
})
console.log("Available schemas:", availableVersificationSchemas)