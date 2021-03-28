const help_message = `\
Parabible DB Importer:
--

 This importer accepts 4 commands:
 
  --reload-all   - Clear the db and do import each module.
  --load-new     - Check for available modules and load anything new
  --load-one     - Expects a name as the next parameter  
  --clear-all    - Delete everything from the db
 
 Modules are expected to be in the same folder as main and should contain:
  - output/module.json
  - output/data.sqlite
`
const options = [
	"--reload-all",
	"--load-new",
	"--load-one",
	"--clear-all",
]
const import_option = process.argv[2] || false
if (!import_option || !options.includes(import_option)) {
	console.log(help_message)
	process.exit()
}
if (import_option !== "--reload-all") {
	console.log("Sorry, only --clear-all is currently supported.")
	process.exit()
}


const INSERT_LIMIT = 5000


const fs = require("fs")
const sqlite = require("better-sqlite3")
const Client = require('pg-native')

const alignmentDb = sqlite("./alignment/super-align/output/data.sqlite")


const files = fs.readdirSync("./")
const foundImports = files.filter(file =>
	fs.existsSync(`./${file}/output/data.sqlite`) &&
	fs.existsSync(`./${file}/output/version.json`)
)
console.log(foundImports)

// Make temporary duplicates...
if (fs.existsSync(`./tmp`)) {
	fs.rmdirSync("./tmp", { recursive: true })
}
fs.mkdirSync("./tmp")
foundImports.forEach(versionPath => {
	fs.copyFileSync(`./${versionPath}/output/data.sqlite`, `./tmp/${versionPath}.sqlite`)
})




const pg = new Client()
pg.connectSync('postgresql://postgres:toor@127.0.0.1:5432/parabibledb')
pg.querySync(`
	DROP TABLE IF EXISTS module_info;
`)
pg.querySync(`
	CREATE TABLE module_info (
		version_id SERIAL PRIMARY KEY,
		name TEXT,
		abbreviation TEXT,
		versification_schema TEXT,
		license TEXT,
		url TEXT
	)
`)
pg.querySync(`
	DROP TABLE IF EXISTS parallel;
`)
pg.querySync(`
	CREATE TABLE parallel (
		parallel_id INTEGER NOT NULL,
		versification_schema_id INTEGER NOT NULL,
		version_id INTEGER NOT NULL,
		rid INTEGER NOT NULL,
		text TEXT
	)
`)
pg.prepareSync('select_parallel_id', `
SELECT parallel_id FROM parallel
WHERE
	(versification_schema_id = $1 AND
	rid = $2)
LIMIT 1;
`, 2)


const featuresSet = new Set(["version_id", "wid", "text", "trailer", "rid", "parallel_id"])
pg.querySync(`
	DROP TABLE IF EXISTS word_features;
`)
pg.querySync(`
	CREATE TABLE word_features (
		version_id INTEGER NOT NULL,
		wid INTEGER NOT NULL,
		text TEXT,
		trailer TEXT,
		rid INTEGER NOT NULL,
		parallel_id INTEGER NOT NULL
	)
`)

const addFeatures = features =>
	features.forEach(f => {
		if (!featuresSet.has(f)) {
			pg.querySync(`
			ALTER TABLE word_features
			ADD COLUMN ${f} TEXT
			`)
			featuresSet.add(f)
		}
	})



// Get available versification schemas
const alignmentStmts = {}
const schemaRowStmt = alignmentDb.prepare(`SELECT * FROM alignment LIMIT 1;`)
const schemaRow = schemaRowStmt.get()
const availableVersificationSchemas = new Set(Object.keys(schemaRow))
availableVersificationSchemas.forEach(k => {
	alignmentStmts[k] = alignmentDb.prepare(`SELECT * FROM alignment WHERE ${k} = ?`)
})
console.log("Available schemas:", availableVersificationSchemas)

const schemaIds = Array.from(availableVersificationSchemas)
const getVersificationId = schemaString => schemaIds.indexOf(schemaString) + 1

const getParallelRid = ({ rid, versificationSchema, versificationSchemaId }) => {
	const row = alignmentStmts[versificationSchema].get(rid)

	for (key in row) {
		if (!row[key] || !availableVersificationSchemas.has(key))
			continue

		const pid = pg.executeSync("select_parallel_id", [
			getVersificationId(key),
			rid
		])

		if (pid[0] && "parallel_id" in pid[0]) {
			return pid[0].parallel_id
		}
	}
	return -1
}

const versionJsonFields = [
	"name", "abbreviation", "versification_schema", "license", "url"
]
const getModuleInfo = () => pg.querySync(`SELECT * FROM module_info;`)

let parallelId = 0
let rowImportCounter = 0
// Process each version...
foundImports.forEach((versionPath, importIteration) => {
	// Load module information and store in pg
	const versionJson = fs.readFileSync(`./${versionPath}/output/version.json`)
	const version = JSON.parse(versionJson)
	pg.querySync(`
		INSERT INTO module_info
			(name, abbreviation, versification_schema, license, url)
		VALUES (
			${versionJsonFields.map(k => pg.escapeLiteral(version[k])).join(",")}
		)
	`)
	{
		const moduleInfo = getModuleInfo()
		const thisModule = moduleInfo.find(m => m.name === version.name)
		version.versionId = thisModule.version_id
		version.versificationId = getVersificationId(version.versification_schema)
	}
	if (!availableVersificationSchemas.has(version.versification_schema)) {
		console.log("No matching versification schema available:", version.versification_schema)
	}
	console.log("\n\n", version)

	// Connect to source sqlite db
	console.log("-- query sqlite and doing inserts to pg --")
	const db = sqlite(`./tmp/${versionPath}.sqlite`)

	// This variable helps us stitch together word_features and the parallel verse_texts
	const ridToParallelId = {}

	console.log("--- parallel text")
	{
		console.log("--- - building row list")
		const vtStmt = db.prepare('SELECT * FROM verse_text ORDER BY rid;')
		const rows = []
		for (const row of vtStmt.iterate()) {
			let parallel_id = 0
			if (importIteration === 0) {
				parallel_id = ++parallelId
			}
			else {
				// Get by querying alignment
				// alignmentDb.prepare....
				parallel_id = +getParallelRid({
					rid: row.rid,
					versificationSchemaId: version.versificationId,
					versificationSchema: version.versification_schema
				})
				if (parallel_id === -1) {
					parallel_id = ++parallelId
				}
			}
			rows.push([
				parallel_id,
				version.versificationId,
				version.versionId,
				row.rid,
				row.text
			])
			ridToParallelId[row.rid] = parallel_id
			if (rows.length % 2000 === 0) {
				console.log("--- -- rows count:", rows.length)
			}
		}
		console.log("--- - rows built:", rows.length)
		console.log("--- - inserting row list")
		console.log("--- - remaining:", rows.length)
		const build_query = values => `
		INSERT INTO parallel VALUES
		${values.map(cols =>
			`(${cols.map(v => pg.escapeLiteral(v)).join(",")})`
		).join(",")};`
		while (rows.length > 0) {
			const values = rows.splice(0, INSERT_LIMIT)
			const query = build_query(values)
			pg.querySync(query)
			console.log("--- - remaining:", rows.length)
		}
	}

	console.log("--- word features")
	{
		let cols = []
		let wfStmt
		try {
			wfStmt = db.prepare('SELECT * FROM word_features;')
		}
		catch (e) {
			console.log("--- Couldn't SELECT from word_features on " + version.name)
			console.log("--- (probably does not exist, skipping)")
			return
		}
		console.log("--- - building row list")
		let addedMissingFeatures = false
		const rows = []
		for (const row of wfStmt.iterate()) {
			if (!addedMissingFeatures) {
				cols = Object.keys(row)
				cols.push("parallel_id")
				cols.push("version_id")
				addFeatures(cols)
				addedMissingFeatures = true
			}
			row.parallel_id = ridToParallelId[row.rid]
			row.version_id = version.versionId
			row.rid = +row.rid
			rows.push(cols.map(k => row[k]))
			if (rows.length % 10000 === 0) {
				console.log("--- -- rows:", rows.length)
			}
		}
		console.log("--- -- rows:", rows.length)

		console.log("--- - inserting row list")
		console.log("--- - remaining:", rows.length)
		const build_query = values => `
		INSERT INTO word_features(${cols.join(",")})
		VALUES ${values.map(cols =>
			`(${cols.map(v => pg.escapeLiteral(v) || "NULL").join(",")})`
		).join(",")};`
		while (rows.length > 0) {
			const values = rows.splice(0, INSERT_LIMIT)
			const query = build_query(values)
			pg.querySync(query)
			console.log("--- - remaining:", rows.length)
		}
	}
})