const Client = require("pg-native")
const pg = new Client()

const INSERTION_LIMIT = 5000

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:toor@127.0.0.1:5432/parabibledb"
pg.connectSync(DATABASE_URL)

// pg.querySync(`CREATE INDEX ON word_features (version_id, wid)`)
// pg.querySync(`CREATE INDEX ON parallel (version_id, rid)`)
// pg.querySync(`CREATE INDEX ON parallel (parallel_id, version_id)`)

const featureFilter = f =>
    f !== "version_id" &&
    f !== "wid" &&
    f !== "leader" && f !== "prefix" &&
    f !== "text" &&
    f !== "trailer" && f !== "suffix" &&
    f !== "parallel_id" &&
    f !== "rid" &&
    !f.endsWith("_node_id")

// const syntaxFilter = f =>
    
const featureRow = pg.querySync(`SELECT * FROM word_features LIMIT 1`)[0]
const featureSet = new Set(Object.keys(featureRow).filter(featureFilter))

console.log(featureSet)


pg.querySync(`
DROP TABLE IF EXISTS feature_index;
CREATE TABLE feature_index (
    feature TEXT NOT NULL,
    value TEXT NOT NULL,
    wids integer[] NOT NULL,
    PRIMARY KEY (feature, value)
);`)



featureSet.forEach(feature => {
    const insertions = []
    const values = pg.querySync(`SELECT DISTINCT ${feature} as value FROM word_features;`)
    console.log(feature)
    console.log("VALUES:", values)
    while (values.length) {
        const { value } = values.pop()
        if (!value)
            continue
        const widResult = pg.querySync(`SELECT wid FROM word_features WHERE ${feature} = ${pg.escapeLiteral(value)}`)
        const wids = widResult.map(w => w.wid)
        insertions.push({feature, value, wids})
        if (values.length % 100 === 0) {
            console.log(feature, value)
            console.log("- remaining:", values.length)
        }
    }
    console.log(insertions)
    while (insertions.length) {
        const values = insertions.splice(0, INSERTION_LIMIT)
        const query = `
        INSERT INTO
            feature_index (feature, value, wids)
        VALUES
        ${values.map(({feature, value, wids}) =>
            `(${pg.escapeLiteral(feature)}, ${pg.escapeLiteral(value)}, '{${wids.join(",")}}')`
        )}`
        pg.querySync(query)
    }    
})

process.exit()




print("creating index")
pg.querySync("CREATE INDEX feature_value_index ON feature_index USING btree (feature, value);")
print("creating intarray extension")
pg.querySync("CREATE EXTENSION IF NOT EXISTS intarray;")