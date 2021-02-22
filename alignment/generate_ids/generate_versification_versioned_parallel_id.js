const versification_schemas = {
    kjv: require("./kjv_versification"),
    bhs: require("./bhs_versification"),
    // lxx: require("./lxx_versification"),
    // gnt: require("./gnt_versification"),
}
const versification_schema_id = {}
Object.keys(versification_schemas).forEach((k, i) => {
    versification_schema_id[k] = i + 1
})

const reference_to_versioned_id = ({ versification_schema, book, chapter, verse }) => {
    const schema_id = versification_schema_id[versification_schema]
    const schema = versification_schemas[versification_schema]
    const book_id = schema.findIndex(b => b.name === book || b.abbreviation === book) + 1
    return schema_id * 10 ** 8 +
        book_id * 10 ** 6 +
        chapter * 10 ** 3 +
        verse
}

const reference_to_unversioned_id = () => {
    throw ("TODO")
}

module.exports = {
    reference_to_versioned_id,
    reference_to_unversioned_id
}