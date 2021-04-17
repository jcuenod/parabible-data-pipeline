const fs = require("fs")
var usfm = require("usfm-js")

const unduplicateNewLines = text => {
    const returnText = text.replace(/\n\n/g, "\n")
    return returnText === text 
        ? text
        : unduplicateNewLines(returnText)
}
const escapeCsvNewLines = (text) => unduplicateNewLines(text).replace(/\n/g, '\\n')
const escapeCsvQuote = (text) => text.replace(/"/g, '""')
const rowToCsv = ({ book, chapter, verse, text }) =>
    `"${book}",${chapter},${verse},"${escapeCsvNewLines(escapeCsvQuote(text))}"`

// The NET has a handful of weird nodes that are (I think) all related to YHWH are parsed
// into this weird content/text tag with a pipe and a strongs number. In short, the parser
// is not working well on these files. It would be better to manually parse something they
// let you download: https://netbible.com/download/ (an esword module/sword project/docx)
const stripPipe = str => str.indexOf("|") > -1
    ? str.substr(0, str.indexOf("|")) + " "
    : str

let unprocessedNodes = []
const textFromVerseObject = vo => {
    if ("text" in vo && "children" in vo) {
        return vo.text + vo.children.map(textFromVerseObject).join("")
    }
    else if ("text" in vo) {
        return stripPipe(vo.text)
    }
    else if ("content" in vo) {
        return stripPipe(vo.content)
    }
    else if ("children" in vo) {
        return vo.children.map(textFromVerseObject).join("")
    }
    unprocessedNodes.push(vo)
    return ""
    // else if ("['section', 'paragraph', 'footnote', 'quote'].includes(vo.type)") {
    // else if ("nextChar" in vo) {
    //     return vo.nextChar
    // }
    // else if ("content" in vo) {
    //     return vo.content
    // }
    // else {
    //     console.log(vo)
    //     throw("didn't find verse text")
    // }
}

const usfmToCsv = ({input, output, writeUnprocessed = true}) => {
    unprocessedNodes = []

    const usfmText = fs.readFileSync(input, "utf-8")
    const toJSON = usfm.toJSON(usfmText)
    fs.writeFileSync(output + ".usfm.json", JSON.stringify(toJSON, null, 2), "utf-8")

    const book = toJSON.headers.find((h) => h.tag === "h").content.trim()

    const flattenedOutput = []
    Object.keys(toJSON.chapters).forEach((chapter) => {
        Object.keys(toJSON.chapters[chapter]).forEach((verse) => {
            if (Number.isNaN(+verse))
                return
            const { verseObjects } = toJSON.chapters[chapter][verse]

            let verseText = ""
            let inSectionFlag = false
            verseObjects.forEach(vo => {
                if (vo.type === "section") {
                    inSectionFlag = true
                }
                else if (vo.type === "paragraph") {
                    inSectionFlag = false
                }
                if (inSectionFlag) {
                    return
                }
            
                verseText += textFromVerseObject(vo)
            })
            flattenedOutput.push({
                book,
                chapter: +chapter,
                verse: +verse,
                text: verseText.trim(),
            })            
        })
    })
    const csvHeader = `book,chapter,verse,text\n`
    const csvText = csvHeader + flattenedOutput.map(rowToCsv).join("\n")
    fs.writeFileSync(output, csvText, "utf-8")
    if (writeUnprocessed) {
        fs.writeFileSync(output + ".unprocessedNodes.json", JSON.stringify(unprocessedNodes, null, 2), "utf-8")
    }
}

module.exports = usfmToCsv