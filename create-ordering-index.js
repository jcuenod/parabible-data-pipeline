// 1   D1   D1   D1
// 2   A2   E2   I2
// 3   V3   A3   M3
// 4   E4   T4
// 6        H5   H4
// 7   S5        A5
// 8   I6        T6
// 9   T7

// Ordered by col 3:

// 1   D1  D1  D1
// 2   I6      I2
// 3           M3
// 4       H5  H4
// 6   A2  A3  A5
// 7   T7  T4  T6

// where do we put:
// V3
// E4  E2
// S5


// 1. put every verse in versification schema in order
// 2. collect all the unordered ones with their rids
//     - have book order per versification schema (be sure to sort by this!)
//     - order them by the lowest one relative to the existing order
//     - put them after the equivalent (or highest equivalent lower than rid)

const Client = require("pg-native")
const pg = new Client()
const INSERT_LIMIT = 25000

const DATABASE_URL =
	process.env.DATABASE_URL ||
	"postgresql://postgres:toor@172.28.0.3:5432/parabible"
pg.connectSync(DATABASE_URL)

pg.querySync(`
DROP TABLE IF EXISTS ordering_index;
CREATE TABLE ordering_index (
	parallel_id INTEGER,
	versification_schema_id INTEGER,
	order_in_schema INTEGER
);`)


console.log("Gathering parallel_id data...")
const completeParallelIdData = pg.querySync(`
	SELECT
		parallel_id,
		ARRAY_AGG(DISTINCT rid) AS rids,
		ARRAY_AGG(DISTINCT versification_schema_id) AS versification_schema_ids
	FROM
		parallel
	GROUP BY
		parallel_id
`)

// Output looks like:
// 922 | {1031048}                    | {1,2,4}
// 923 | {1031049}                    | {1,2,4}
// 924 | {1031050}                    | {1,2,4}
// 925 | {1031051}                    | {1,2}
// 926 | {1031052}                    | {1,2,4}
// 927 | {1031053}                    | {1,2,4}
// 928 | {1031054}                    | {1,2,4}
// 929 | {1031055,1032001}            | {1,2,4}

// For each versification schema
// 	- order the rids that are in the schema
// 	- get the rids that are not in the schema
// 	- order the rids that are not in the schema:
// 		- by book, chapter, verse
// 		- after the equivalent (or highest equivalent lower than rid)

// TODO: use module info when we've reimported everything
const schemaIds = [
	{ schema: "kjv", id: 1 },
	{ schema: "bhs", id: 2 },
	{ schema: "gnt", id: 3 },
	{ schema: "lxx", id: 4 },
]
const schemaNameFromId = id => schemaIds.find(x => x.id === id).schema
const schemaIdFromName = name => schemaIds.find(x => x.schema === name).id
const bookOrder = require("./alignment/super-align/book_order.js")
const ridToBookId = rid => Math.floor(rid / 1000000)
const bookNameFromRid = rid =>
	bookOrder.index[ridToBookId(rid) - 1]

const orderRidsWithBookAwarenessForSchema = schemaId => (ridA, ridB) => {
	if (ridToBookId(ridA) !== ridToBookId(ridB)) {
		const schemaName = schemaNameFromId(schemaId)
		const aBookName = bookNameFromRid(ridA)
		const bBookName = bookNameFromRid(ridB)
		const bookA = bookOrder[schemaName].indexOf(aBookName)
		const bookB = bookOrder[schemaName].indexOf(bBookName)
		return bookA - bookB
	}
	return ridA - ridB
}

const sortFunctionForSchemaId = schemaId => (a, b) => {
	const aRid = "schema_rid" in a
		? a.schema_rid
		: Math.min(...a.rids)
	const bRid = "schema_rid" in b
		? b.schema_rid
		: Math.min(...b.rids)

	return orderRidsWithBookAwarenessForSchema(schemaId)(aRid, bRid)
}

schemaIds.forEach(({ schema, id: schemaId }) => {
	console.log(`Getting parallel_id for ${schema}...`)
	const schemaParallelIdData = pg.querySync(`
		SELECT
			parallel_id,
			rid
		FROM
			parallel
		WHERE
			versification_schema_id = ${schemaId}
		ORDER BY
			rid
	`)
	console.log(` - sorting ${schema}`)
	const schemaRidFromParallelId = (parallelId) => schemaParallelIdData.find(({ parallel_id }) => parallel_id === parallelId).rid
	const schemaParallelIds = new Set(schemaParallelIdData.map(row => row.parallel_id))
	const schemaModifiedParallelIdData = completeParallelIdData.map(row => {
		if (schemaParallelIds.has(row.parallel_id)) {
			return {
				schema_rid: schemaRidFromParallelId(row.parallel_id),
				...row
			}
		}
		return row
	})
	const sortedParalellelIds = schemaModifiedParallelIdData.sort(sortFunctionForSchemaId(schemaId))

	console.log("Sorting parallel ids for schema: ", schema)
	const rows = sortedParalellelIds.map(({ parallel_id }, index) =>
		[parallel_id, schemaId, index]
	)

	const build_query = (values) => `
		INSERT INTO ordering_index VALUES
		${values
			.map(cols => `(${cols.map(v => pg.escapeLiteral(v)).join(",")})`)
			.join(",")
		};
	`
	while (rows.length > 0) {
		const values = rows.splice(0, INSERT_LIMIT)
		const query = build_query(values)
		pg.querySync(query)
		console.log("--- - remaining:", rows.length)
	}
})

// Also, consider picking something like the book of Ruth and seeing
// what parallel_id it gets for each of the versification schemas.
// This will give a good indication for whether the order function worked.

// SELECT
//     o1.parallel_id,
//     o1.order_in_schema,
//     o2.order_in_schema
// FROM
//     ordering_index o1
//     INNER JOIN ordering_index o2 ON o1.parallel_id = o2.parallel_id
// WHERE
//     o1.order_in_schema != o2.order_in_schema;