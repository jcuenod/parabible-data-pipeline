const codyData = require("./hebrew.json")
const denylist = new Set(require("./denylist.json"))

const terms = Object.values(codyData["terms_dict"])
const dupTerms =
  terms
    .filter(t => /.*;.*/.test(t.term))
    .filter(t => !denylist.has(t.gloss))
    .map(t => ({ term: t.term, gloss: t.gloss }))

console.log(JSON.stringify(dupTerms, null, 2))
