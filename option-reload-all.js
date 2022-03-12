const INSERT_LIMIT = 25000


/*
 * features.json
 * {
 * 	featureNames: [
 * 	 { key: part_of_speech, value: "Part of Speech" },
 * 	 ...
 * 	],
 * 	featureValues: [
 * 	 { feature: part_of_speech, key: noun, value: "Noun" }
 * 	]
 * }
 */

const excludedFeatures = new Set(["word_uid", "module_id", "wid", "leader", "text", "trailer", "rid", "parallel_id", "phrase_node_id", "clause_node_id", "sentence_node_id"])
const fd = require("./features.json")
const knownFeatures = new Set(fd.features.map(f => f.key))
const isFeatureKnown = (feature) => knownFeatures.has(feature)
const isFeatureEnum = (feature) => fd.features.find(f => f.key === feature).enum
const isValueKnown = (feature, value) => {
	if (!isFeatureKnown(feature)) return false

	// We only need to validate values if it's an enum
	return isFeatureEnum(feature)
		? fd.values.find(v => v.feature === feature && v.key === value)
		: true
}

const validateFeatures = db => {
	const tables = db.prepare(`SELECT name FROM sqlite_schema 
			WHERE type IN ('table','view') 
			AND name NOT LIKE 'sqlite_%'
			ORDER BY 1
	`).all().map(t => t.name)
	console.log(tables)
	if (!tables.includes("word_features")) {
		console.log(" - Couldn't find word_features table, probably no features in the database. So nevermind validating features...")
		return
	}
	const features = db.prepare(`select name from pragma_table_info('word_features');`).all().map(f => f.name)
	console.log(features)
	features.forEach(feature => {
		if (excludedFeatures.has(feature))
			return
		if (!isFeatureKnown(feature))
			throw (`Unknown feature: ${feature}`)

		if (isFeatureEnum(feature)) {
			const actualValues = db.prepare(`select distinct ${feature} as f from word_features where ${feature} != ''`).all().map(row => row.f)
			console.log(feature, actualValues)
			const unknownValues = actualValues.filter(value => !isValueKnown(feature, value))
			if (unknownValues.length > 0) {
				console.error(`Expected defined set of values but found unknown values:\n${JSON.stringify(unknownValues)}`)
				throw ("Expected defined set of values but found unknown values")
			}
		}
	})
	console.log(" - Features are valid!")
}

const fs = require("fs")
const sqlite = require("better-sqlite3")
const Client = require("pg-native")

const alignmentDb = sqlite("./alignment/super-align/output/data.sqlite")

console.log("Checking for modules")
const files = fs.readdirSync("./")
const foundImports = files.filter(
	(file) =>
		fs.existsSync(`./${file}/output/data.sqlite`) &&
		fs.existsSync(`./${file}/output/module.json`)
)
console.log("Found:", foundImports)

console.log("Making `/tmp` duplicates")
// Make temporary duplicates...
if (fs.existsSync(`./tmp`)) {
	fs.rmdirSync("./tmp", { recursive: true })
}
fs.mkdirSync("./tmp")
foundImports.forEach((modulePath) => {
	fs.copyFileSync(
		`./${modulePath}/output/data.sqlite`,
		`./tmp/${modulePath}.sqlite`
	)
	// Check that the word features in each import with word data are known by the importer (the single source of truth on what word features mean)
	console.log(`Validating word_features in ${modulePath}`)
	validateFeatures(sqlite(`./tmp/${modulePath}.sqlite`))
})

console.log("\nSetting up DB")
const pg = new Client()
const DATABASE_URL =
	process.env.DATABASE_URL ||
	"postgresql://postgres:toor@127.0.0.1:5432/parabible"
pg.connectSync(DATABASE_URL)
pg.querySync(`
	DROP TABLE IF EXISTS module_info;
`)
pg.querySync(`
	CREATE TABLE module_info (
		module_id SERIAL PRIMARY KEY,
		name TEXT,
		abbreviation TEXT,
		versification_schema TEXT,
		versification_schema_id INTEGER NOT NULL,
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
		module_id INTEGER NOT NULL,
		rid INTEGER NOT NULL,
		text TEXT
	)
`)
pg.prepareSync(
	"select_parallel_id",
	`
SELECT parallel_id FROM parallel
WHERE
	(versification_schema_id = $1 AND
	rid = $2)
LIMIT 1;
`,
	2
)

const featuresSet = new Set([
	"module_id",
	"wid",
	"leader",
	"text",
	"trailer",
	"rid",
	"parallel_id",
])
pg.querySync(`
	DROP TABLE IF EXISTS word_features;
`)
pg.querySync(`
	CREATE TABLE word_features (
		word_uid SERIAL PRIMARY KEY,
		module_id INTEGER NOT NULL,
		wid INTEGER NOT NULL,
		leader TEXT,
		text TEXT,
		trailer TEXT,
		rid INTEGER NOT NULL,
		parallel_id INTEGER NOT NULL
	)
`)

const addFeatures = (features) =>
	features.forEach((f) => {
		if (!featuresSet.has(f)) {
			pg.querySync(`
			ALTER TABLE word_features
			ADD COLUMN ${f} ${f.endsWith("_node_id") ? "INTEGER" : "TEXT"}
			`)
			featuresSet.add(f)
		}
	})

console.log("\nGetting versification schemas")
// Get available versification schemas
const schemaRowStmt = alignmentDb.prepare(`SELECT * FROM alignment LIMIT 1;`)
const schemaRow = schemaRowStmt.get()
const availableVersificationSchemas = new Set(Object.keys(schemaRow))
console.log("Available schemas:", availableVersificationSchemas)
const alignmentStmts = Object.fromEntries(
	Array.from(availableVersificationSchemas).map(schema =>
		[schema, alignmentDb.prepare(`SELECT * FROM alignment WHERE ${schema} = ?`)]
	)
)

const schemaIds = Array.from(availableVersificationSchemas)
const getVersificationId = (schemaString) => schemaIds.indexOf(schemaString) + 1

const getParallelRid = ({
	rid,
	versificationSchema,
	versificationSchemaId,
}) => {
	const row = alignmentStmts[versificationSchema].get(rid)

	for (key in row) {
		if (!row[key] || !availableVersificationSchemas.has(key)) continue

		const pid = pg.executeSync("select_parallel_id", [
			getVersificationId(key),
			row[key],
		])

		if (pid[0] && "parallel_id" in pid[0]) {
			return pid[0].parallel_id
		}
	}
	return -1
}

console.log("\nInserting Modules")
const moduleJsonFields = [
	"name",
	"abbreviation",
	"versification_schema",
	"versificationId",
	"license",
	"url",
]
const getModuleInfo = () => pg.querySync(`SELECT * FROM module_info;`)

let parallelId = 0
let rowImportCounter = 0
// Process each module...
foundImports.forEach((modulePath, importIteration) => {
	// Load module information and store in pg
	const moduleJson = fs.readFileSync(`./${modulePath}/output/module.json`)
	const module = JSON.parse(moduleJson)
	module.versificationId = getVersificationId(module.versification_schema)
	pg.querySync(`
		INSERT INTO module_info
			(name, abbreviation, versification_schema, versification_schema_id, license, url)
		VALUES (
			${moduleJsonFields.map(k => pg.escapeLiteral(module[k])).join(",")}
		)
	`)
	{
		const moduleInfo = getModuleInfo()
		const thisModule = moduleInfo.find((m) => m.name === module.name)
		module.moduleId = thisModule.module_id
	}
	if (!availableVersificationSchemas.has(module.versification_schema)) {
		console.log(
			"No matching versification schema available:",
			module.versification_schema
		)
	}
	console.log("\n\n", module)

	// Connect to source sqlite db
	console.log("-- query sqlite and doing inserts to pg --")
	const db = sqlite(`./tmp/${modulePath}.sqlite`)

	// This variable helps us stitch together word_features and the parallel verse_texts
	const ridToParallelId = {}

	console.log("--- parallel text")
	{
		console.log("--- - building row list")
		const vtStmt = db.prepare("SELECT * FROM verse_text ORDER BY rid;").all()
		const rows = []
		vtStmt.forEach(row => {
			let parallel_id = 0
			if (importIteration === 0) {
				parallel_id = ++parallelId
			} else {
				// Get by querying alignment
				// alignmentDb.prepare....
				parallel_id = +getParallelRid({
					rid: row.rid,
					versificationSchemaId: module.versificationId,
					versificationSchema: module.versification_schema,
				})
				if (parallel_id === -1) {
					parallel_id = ++parallelId
				}
			}
			rows.push([
				parallel_id,
				module.versificationId,
				module.moduleId,
				row.rid,
				row.text,
			])
			ridToParallelId[row.rid] = parallel_id
			if (rows.length % 2000 === 0) {
				console.log("--- -- rows count:", rows.length)
			}
		})
		console.log("--- - rows built:", rows.length)
		console.log("--- - inserting row list")
		console.log("--- - remaining:", rows.length)
		const build_query = (values) => `
		INSERT INTO parallel VALUES
		${values
				.map((cols) => `(${cols.map((v) => pg.escapeLiteral(v)).join(",")})`)
				.join(",")};`
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
			wfStmt = db.prepare("SELECT * FROM word_features;").all()
		} catch (e) {
			console.log("--- Couldn't SELECT from word_features on " + module.name)
			console.log("--- (probably does not exist, skipping)")
			return
		}
		console.log("--- - building row list")
		let addedMissingFeatures = false
		const rows = []
		wfStmt.forEach(row => {
			if (!addedMissingFeatures) {
				cols = Object.keys(row)
				cols.push("parallel_id")
				cols.push("module_id")
				addFeatures(cols)
				addedMissingFeatures = true
			}
			row.parallel_id = ridToParallelId[row.rid]
			row.module_id = module.moduleId
			row.rid = +row.rid
			rows.push(cols.map((k) => row[k]))
			if (rows.length % 10000 === 0) {
				console.log("--- -- rows:", rows.length)
			}
		})
		console.log("--- -- rows:", rows.length)

		console.log("--- - inserting row list")
		console.log("--- - remaining:", rows.length)
		const build_query = (values) => `
		INSERT INTO word_features(${cols.join(",")})
		VALUES ${values
				.map(
					(cols) =>
						`(${cols.map((v) => pg.escapeLiteral(v) || "NULL").join(",")})`
				)
				.join(",")};`
		while (rows.length > 0) {
			const values = rows.splice(0, INSERT_LIMIT)
			const query = build_query(values)
			pg.querySync(query)
			console.log("--- - remaining:", rows.length)
		}
	}
})

pg.querySync(`CREATE INDEX ON word_features (module_id, wid)`)
pg.querySync(`CREATE INDEX ON parallel (module_id, rid)`)
pg.querySync(`CREATE INDEX ON parallel (parallel_id, module_id)`)
