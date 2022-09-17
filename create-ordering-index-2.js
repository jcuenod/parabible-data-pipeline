// take the kjv order of parallel_ids
// grab the pIds that have only one versification_schema
// - insert them into the order in the appropriate place

const v_schemas_by_versification_hierarchy = [
	{ name: "kjv", id: 1 },
	{ name: "bhs", id: 2 },
	{ name: "gnt", id: 3 },
	{ name: "lxx", id: 4 },
]

const Client = require("pg-native")
const pg = new Client()
const DATABASE_URL =
	process.env.DATABASE_URL ||
	"postgresql://postgres:toor@127.0.0.1:5432/parabible"
pg.connectSync(DATABASE_URL)

/* 
 * versification_schemas align rids by parallel_id
 * if multiple rids have the same versification schema and parallel_id,
 * 		the rids will be identical
 * therefore, MIN does not take the minimum,
 * 		it "unwraps" the only element of the array
 */
const pidsOrderedBySchema = schema_id => `
	SELECT * FROM (
		SELECT
			parallel_id,
			MIN(rid) FILTER (WHERE versification_schema_id=${schema_id}) AS rid
		FROM 
			parallel
		GROUP BY
			parallel_id
		ORDER BY
			rid) t
	WHERE rid IS NOT NULL
`

// const pids = pg.querySync(pidsOrderedBySchema(1))
// {
// 	const r = pids.find(p => p.parallel_id === 31134)
// 	console.log(r)
// }
// const pids2 = pg.querySync(pidsOrderedBySchema(2))
// {
// 	const r = pids2.find(p => p.parallel_id === 31134)
// 	console.log(r)
// }




const generateOrderForSchema = schema_name => {
	const i = v_schemas_by_versification_hierarchy.findIndex(v => v.name === schema_name)
	const schema_ids = v_schemas_by_versification_hierarchy.map(v => v.id)
	schemas = [
		schema_ids[i],
		...schema_ids.slice(0, i),
		...schema_ids.slice(i + 1)
	]

	let order_for_schema = []
	schemas.forEach(schema_id => {
		const pids = pg.querySync(pidsOrderedBySchema(schema_id))

		// remove pids that are represented
		const every_pid = new Set(order_for_schema.map(o => o.parallel_id))
		const new_pids = pids.filter(p => !every_pid.has(p.parallel_id))

		if (order_for_schema.length === 0) {
			order_for_schema = pids
			return
		}

		new_pids.forEach(pid => {
			const previous_pid_index = pids.findIndex(p => p.rid === pid.rid) - 1
			if (previous_pid_index < 0) {
				order_for_schema.splice(0, 0, pid)
				every_pid.add(pid.parallel_id)
				return
			}
			const previous_parallel_id = pids[previous_pid_index].parallel_id
			const location_to_splice = order_for_schema.findIndex(o => o.parallel_id === previous_parallel_id)
			order_for_schema.splice(location_to_splice + 1, 0, {
				parallel_id: pid.parallel_id
			})
			every_pid.add(pid.parallel_id)
		})
	})
	return order_for_schema
}

pg.querySync(`
	DROP TABLE IF EXISTS ordering_index;
	CREATE TABLE ordering_index (
		parallel_id INTEGER,
		versification_schema_id INTEGER,
		rid INTEGER,
		order_in_schema INTEGER
	);
`)

const generateInsertQuery = values => `
	INSERT INTO ordering_index VALUES
	${values
		.map(c => `(${c.parallel_id}, ${c.versification_schema_id}, ${c.rid || "NULL"}, ${c.order_in_schema})`)
		.join(",")
	};
`

v_schemas_by_versification_hierarchy.forEach(s => {
	const order = generateOrderForSchema(s.name)
	const schema_ordering_index = order.map((o, i) => ({
		parallel_id: o.parallel_id,
		versification_schema_id: s.id,
		rid: o.rid,
		order_in_schema: i,
	}))
	while (schema_ordering_index.length > 0) {
		const toInsert = schema_ordering_index.splice(0, 5000)
		const q = generateInsertQuery(toInsert)
		pg.querySync(q)
	}
})
console.log("done")