const fs = require('fs')

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const files = [ "1Chr", "2Macc", "DanOG", "Gen", "Joel",
                "Mal", "PsSol", "TobS", "1Esd", "2Sam",
                "DanTh", "Hab", "Jonah", "Mic", "Wis",
                "1Kgs", "3Macc", "Deut", "Hag", "JoshA", 
                "Nah", "Ruth", "Zech", "1Macc", "4Macc",
                "Eccl", "Hos", "JoshB", "Num", "Sir",
                "Zeph", "1Sam", "Amos", "EpJer", "Isa",
                "JudgA", "Obad", "Song", "2Chr", "Bar",
                "Esth", "Jdt", "JudgB", "Odes", "SusOG",
                "2Esd", "BelOG", "Exod", "Jer", "Lam",
                "Prov", "SusTh", "2Kgs", "BelTh", "Ezek",
                "Job", "Lev", "Ps", "TobBA" ]

const greekLemmasByBook = {}
files.forEach(file => {
    greekLemmasByBook[file] = readJson(__dirname + `/GreekResources/LxxLemmas/${file}.js`)
})

module.exports = greekLemmasByBook