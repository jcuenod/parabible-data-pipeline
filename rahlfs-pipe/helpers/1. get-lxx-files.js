const fs = require("fs")
const cheerio = require('cheerio')
const download = require("./download.js")
const lxxuri = "http://ccat.sas.upenn.edu/gopher/text/religion/biblical/lxxmorph/"

const indexPath = "./data/lxx_files/"
const indexFilename = "index.html"
try {
    fs.mkdirSync(indexPath)
} catch (err) {
    if (err.code !== 'EEXIST') throw err
}


console.log("BUSY DOWNLOADING")
download(lxxuri, indexPath + indexFilename, async () => {
    const indexDocument = fs.readFileSync(indexPath + indexFilename, "utf8")
    const $ = cheerio.load(indexDocument)
    const hrefs = $("a").get().map(a => a.attribs.href)
    const mlxx = hrefs.filter(a => a.endsWith(".mlxx"))
    mlxx.forEach(filename => {
        download(lxxuri + filename, indexPath + filename, tryDone(filename))
    })
})
let doneTally = 0
const tryDone = (title) => {
    doneTally++
    return () => {
        doneTally--
        setTimeout(() => {
            console.log(" - done with", title)
            if (doneTally === 0) {
                console.log("Complete!")
            }
            else {
                console.log(" - another", doneTally)
            }
        }, 100)
    }
}