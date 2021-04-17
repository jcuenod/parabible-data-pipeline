// CURRENTLY TAKES 1 HOUR
// Timing: node create-indices.js  10.41s user 2.08s system 0% cpu 56:36.92 total

const Client = require("pg-native")
const pg = new Client()

const INSERTION_LIMIT = 5000

const DATABASE_URL =
	process.env.DATABASE_URL ||
	"postgresql://postgres:toor@127.0.0.1:5432/parabible"
pg.connectSync(DATABASE_URL)

// pg.querySync(`CREATE INDEX ON word_features (version_id, wid)`)
// pg.querySync(`CREATE INDEX ON parallel (version_id, rid)`)
// pg.querySync(`CREATE INDEX ON parallel (parallel_id, version_id)`)

const featureFilter = (f) =>
	f !== "word_uid" &&
	f !== "version_id" &&
	f !== "wid" &&
	f !== "leader" &&
	f !== "prefix" &&
	f !== "text" &&
	f !== "trailer" &&
	f !== "suffix" &&
	f !== "parallel_id" &&
	f !== "rid" &&
	!f.endsWith("_node_id")

const syntaxFilter = (f) =>
	f === "parallel_id" || f === "rid" || f.endsWith("_node_id")

const featureRow = pg.querySync(`SELECT * FROM word_features LIMIT 1`)[0]
const featureSet = new Set(Object.keys(featureRow).filter(featureFilter))
const syntaxSet = new Set(Object.keys(featureRow).filter(syntaxFilter))

console.log(featureSet)

pg.querySync(`
DROP TABLE IF EXISTS feature_index;
CREATE TABLE feature_index (
    feature TEXT NOT NULL,
    value TEXT NOT NULL,
    word_uids integer[] NOT NULL,
    PRIMARY KEY (feature, value)
);`)

featureSet.forEach((feature) => {
	const insertQuery = `
	INSERT INTO feature_index 
		SELECT
			'${feature}' AS feature,
			${feature} AS value,
			array_agg(word_uid) AS word_uids
		FROM
			word_features
		WHERE
			${feature} IS NOT NULL
		GROUP BY
			${feature}`
	console.log(insertQuery)
	const values = pg.querySync(insertQuery)
	// const insertions = []
	// const values = pg.querySync(`SELECT DISTINCT ${feature} as value FROM word_features;`)
	// console.log(feature)
	// console.log("VALUES:", values)
	// while (values.length) {
	// 	const { value } = values.pop()
	// 	if (!value) continue
	// 	const wordUidResult = pg.querySync(
	// 		`SELECT word_uid FROM word_features WHERE ${feature} = ${pg.escapeLiteral(
	// 			value
	// 		)}`
	// 	)
	// 	const wordUids = wordUidResult.map((w) => w["word_uid"])
	// 	insertions.push({ feature, value, wordUids })
	// 	if (values.length % 100 === 0) {
	// 		console.log(feature, value)
	// 		console.log("- remaining:", values.length)
	// 	}
	// }
	// console.log(insertions)
	// while (insertions.length) {
	// 	const values = insertions.splice(0, INSERTION_LIMIT)
	// 	const query = `
	// INSERT INTO
	// feature_index (feature, value, word_uids)
	// VALUES
	// ${values.map(({ feature, value, wordUids }) =>
	// 		`(${pg.escapeLiteral(feature)}, ${pg.escapeLiteral(
	// 			value
	// 		)}, '{${wordUids.join(",")}}')`
	// 	)}`
	// 	pg.querySync(query)
	// }
})

console.log("Creating index on feature_values")
pg.querySync(
	"CREATE INDEX feature_value_index ON feature_index USING btree (feature, value);"
)

console.log("Creating intarray extension")
pg.querySync("CREATE EXTENSION IF NOT EXISTS intarray;")

// Create indices on syntax nodes
console.log(
	"Creating indices on word_features for range_nodes (verse, sentence, clause, phrase, etc.)"
)
console.log(syntaxSet)
syntaxSet.forEach((nodeType) => {
	pg.querySync(
		`CREATE INDEX ${nodeType}_wuid_idx ON word_features (word_uid, ${nodeType})`
	)
})

console.log("Creating mappings from tree_nodes to parallel_rids")

// this doesn't seem to help:
// create extension btree_gin
// create index fvwuid on feature_index using gin (feature, value, word_uids)

