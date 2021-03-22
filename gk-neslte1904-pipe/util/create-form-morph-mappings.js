const fs = require("fs")
const parse = require("./pyParseWrapper")

const lines = fs.readFileSync("../Nestle1904/morph/Nestle1904.csv", "utf-8").split("\n").filter(l => !!l)
const headers = lines.shift().trim().split("\t")
const fields_by_line = lines.map(l => l.trim().split("\t"))

const parsingAbbrMappings = require("./morph-abbreviation-mappings.json")
const mapParsing = pObj => {
    Object.keys(pObj).forEach(k => {
        if (k === "tag")
            return
        if (k in parsingAbbrMappings) {
            const v = pObj[k]
            pObj[k] = parsingAbbrMappings[k][v]
        }
        else {
            console.log(pObj)
            console.log(k, Object.keys(parsingAbbrMappings))
            process.exit()
        }
    })
    return pObj
}

// form_morphs = 3
const morphs = fields_by_line.map(l => l[3])

const unique_morphs = new Set(morphs)
const form_morph_codes = {}
Array.from(unique_morphs).forEach((m, i) => {
    if (m === "V-PEM-2P@@V-PNM-2P") {
        m = "V-PEM-2P"
    }
    const parsing = parse(m)
    delete parsing["possessor_number"]

    form_morph_codes[m] = mapParsing(parsing)
    if (i % 100 === 0) {
        console.log(`${i}/${unique_morphs.size} done...`)
    }
})

fs.writeFileSync("./form_morph_codes.json", JSON.stringify(form_morph_codes), "utf-8")