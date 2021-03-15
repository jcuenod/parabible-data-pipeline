const fs = require("fs")
const sqlite = require("better-sqlite3")
const Client = require('pg-native')

const alignmentDb = sqlite("./alignment/biblecrawler/alignment.db")

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
pg.prepareSync('insert_parallel_verse_text', `
INSERT INTO parallel VALUES (
	$1,
	$2,
	$3,
	$4,
	$5
);`, 5)
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


const versionData = {
	versificationSchemas: [],
	versions: []
}
const getVersificationId = v => {
	if (!versionData.versificationSchemas.includes(v)) {
		versionData.versificationSchemas.push(v)
	}
	return versionData.versificationSchemas.indexOf(v)
}
const getVersionId = v => {
	if (!versionData.versions.includes(v)) {
		versionData.versions.push(v)
	}
	return versionData.versions.indexOf(v)
}



const alignmentStmts = {
	"kjv": alignmentDb.prepare('SELECT * FROM alignment WHERE kjv = ?'),
	"bhs": alignmentDb.prepare('SELECT * FROM alignment WHERE bhs = ?'),
	"lxx": alignmentDb.prepare('SELECT * FROM alignment WHERE lxx = ?'),
	"gnt": alignmentDb.prepare('SELECT * FROM alignment WHERE gnt = ?'),
	"vul": alignmentDb.prepare('SELECT * FROM alignment WHERE vul = ?'),
}
const getParallelRid = ({ rid, versificationSchema, versificationSchemaId }) => {
	const row = alignmentStmts[versificationSchema].get(rid)
	for (key in row) {
		if (versificationSchema === key || !row[key] || !versionData.versificationSchemas.includes(key))
			continue

		const pid = pg.executeSync("select_parallel_id", [
			getVersificationId(key),
			rid
		])[0]
		if (pid && "parallel_id" in pid)
			return pid.parallel_id
	}
	return -1
}


let parallelId = 0
let rowImportCounter = 0
let versionImportCounter = 0;
// Process each version...
foundImports.forEach(versionPath => {
	const ridToParallelId = {}

	const versionJson = fs.readFileSync(`./${versionPath}/output/version.json`)
	const version = JSON.parse(versionJson)
	version.versificationId = getVersificationId(version.versification_schema)
	version.versionId = getVersionId(version.abbreviation)

	console.log(versionImportCounter, version)

	console.log("-- query sqlite and doing inserts to pg --")
	const db = sqlite(`./tmp/${versionPath}.sqlite`)
	const vtStmt = db.prepare('SELECT * FROM verse_text ORDER BY rid;')
	for (const row of vtStmt.iterate()) {
		let parallel_id = 0
		if (versionImportCounter === 0) {
			parallel_id = ++parallelId
		}
		else {
			// Get by querying alignment
			// alignmentDb.prepare....
			parallel_id = getParallelRid({
				rid: row.rid,
				versificationSchemaId: version.versificationId,
				versificationSchema: version.versification_schema
			})
			if (parallel_id === -1) {
				parallel_id = ++parallelId
			}
		}
		const pgrow = pg.executeSync("insert_parallel_verse_text", [
			parallel_id,
			version.versificationId,
			version.versionId,
			row.rid,
			row.text
		])
		ridToParallelId[row.rid] = parallel_id
		if (++rowImportCounter % 5000 === 0) {
			console.log("another 5000...")
		}
	}


	let cols = []
	const wfStmt = db.prepare('SELECT * FROM word_features;')
	let addedMissingFeatures = false
	for (const row of wfStmt.iterate()) {
		if (!addedMissingFeatures) {
			cols = Object.keys(row)
			cols.push("parallel_id")
			cols.push("version_id")
			addFeatures(cols)
			addedMissingFeatures = true
			// Prepare insert statement now that the missing columns are there...
			console.log(`INSERT INTO word_features(${cols.join(",")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(",")});`)
			pg.prepareSync(`wf_${versionPath}`,
				`INSERT INTO word_features(${cols.join(",")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(",")});`,
				cols.length)
		}
		row.parallel_id = ridToParallelId[row.rid]
		row.version_id = version.versionId
		row.rid = +row.rid
		pg.executeSync(`wf_${versionPath}`, cols.map(k => row[k]))
		if (++rowImportCounter % 25000 === 0) {
			console.log("another 25000...")
		}
	}

	versionImportCounter++
	console.log(versionData)
})
console.log(versionData)

fs.writeFileSync("./version_import_information.json", JSON.stringify(versionData), "utf-8")