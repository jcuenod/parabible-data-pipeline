const codyData = require("./hebrew.json")

const terms = Object.values(codyData["terms_dict"])
const dupTerms = 
  terms
    .filter(t => /.*;.*/.test(t.term))
    .map(t => ({term:t.term, gloss:t.gloss}))

console.log(dupTerms)
