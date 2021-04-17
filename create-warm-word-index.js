const Client = require("pg-native")
const pg = new Client()

const INSERTION_LIMIT = 5000

const DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgresql://postgres:toor@127.0.0.1:5432/parabible"
pg.connectSync(DATABASE_URL)

const featureRow = pg.querySync(`SELECT * FROM word_features LIMIT 1`)[0]
const syntaxSet = new Set(Object.keys(featureRow).filter(f => f.endsWith("_node_id")))

pg.querySync(`
DROP TABLE IF EXISTS warm_word_index;
CREATE TABLE warm_word_index (
    version_id INTEGER NOT NULL,
    tree_node_type TEXT NOT NULL,
    tree_node INTEGER NOT NULL,
    wids INTEGER[] NOT NULL,
    PRIMARY KEY(version_id, tree_node_type, tree_node)
);`)

syntaxSet.forEach(treeNodeType => {
    pg.querySync(`
    INSERT INTO warm_word_index
        SELECT
            version_id,
            '${treeNodeType}' AS tree_node_type,
            ${treeNodeType} AS tree_node,
            array_agg(wid) AS wids
        FROM
            word_features
        WHERE
            ${treeNodeType} IS NOT NULL
        GROUP BY
            version_id,
            ${treeNodeType};`)
})