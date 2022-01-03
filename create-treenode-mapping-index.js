const Client = require("pg-native")
const pg = new Client()

const INSERTION_LIMIT = 5000

const DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgresql://postgres:toor@127.0.0.1:5432/parabible"
pg.connectSync(DATABASE_URL)

const parallelColumn = "parallel_id"

const treeNodeFilter = (f) =>
    f === parallelColumn ||
    f === "rid" ||
    f.endsWith("_node_id")

const featureRow = pg.querySync(`SELECT * FROM word_features LIMIT 1`)[0]
const treeNodeSet = new Set(Object.keys(featureRow).filter(treeNodeFilter))

console.log(treeNodeSet)

pg.querySync(`
DROP TABLE IF EXISTS tree_node_mapping_index;
CREATE TABLE tree_node_mapping_index (
    parallel_id INTEGER NOT NULL,
    module_id INTEGER NOT NULL,
    tree_node_type TEXT NOT NULL,
    tree_node INTEGER NOT NULL,
    PRIMARY KEY (parallel_id, module_id, tree_node_type, tree_node)
);`)

treeNodeSet.forEach((treeNode) => {
    console.log(`Working on ${treeNode}`)
    const select = `
        SELECT DISTINCT
            ${parallelColumn},
            module_id,
            '${treeNode}' as tree_node_type,
            ${treeNode} as tree_node
        FROM
            word_features
        WHERE
            ${treeNode} IS NOT NULL
        GROUP BY ${parallelColumn}, module_id, tree_node_type, tree_node
    `
    console.log(select)
    pg.querySync(`
    INSERT INTO tree_node_mapping_index
        ${select}
    `)
})
