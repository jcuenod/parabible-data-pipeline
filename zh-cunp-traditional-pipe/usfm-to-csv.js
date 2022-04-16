const fs = require("fs")
var usfm = require("usfm-js")

const unduplicateNewLines = (text) => {
	const returnText = text.replace(/\n\n/g, "\n")
	return returnText === text ? text : unduplicateNewLines(returnText)
}
const escapeCsvNewLines = (text) =>
	unduplicateNewLines(text).replace(/\n/g, "<br />")
const escapeCsvQuote = (text) => text.replace(/"/g, '""')
const rowToCsv = ({ book, chapter, verse, text }) =>
	`"${book}",${chapter},${verse},"${escapeCsvNewLines(escapeCsvQuote(text))}"`

let unprocessedNodes = []
const textFromVerseObject = (vo) => {
	if ("text" in vo && "children" in vo) {
		return vo.text + vo.children.map(textFromVerseObject).join("")
	} else if ("text" in vo) {
		return vo.text
	} else if ("children" in vo) {
		return vo.children.map(textFromVerseObject).join("")
	}
	unprocessedNodes.push(vo)
	return ""
}

const usfmToCsv = ({ input, output, writeUnprocessed = true }) => {
	unprocessedNodes = []

	const usfmText = fs.readFileSync(input, "utf-8")
	const toJSON = usfm.toJSON(usfmText)
	// fs.writeFileSync(output + ".json", JSON.stringify(toJSON, null, 2), "utf-8")

	const book = toJSON.headers.find((h) => h.tag === "h").content.trim()

	const flattenedOutput = []
	Object.keys(toJSON.chapters).forEach((chapter) => {
		Object.keys(toJSON.chapters[chapter]).forEach((verse) => {
			if (Number.isNaN(+verse)) return
			const { verseObjects } = toJSON.chapters[chapter][verse]
			flattenedOutput.push({
				book,
				chapter: +chapter,
				verse: +verse,
				text: verseObjects.map(textFromVerseObject).join("").trim(),
			})
		})
	})
	const csvHeader = `book,chapter,verse,text\n`
	const csvText = csvHeader + flattenedOutput.map(rowToCsv).join("\n")
	fs.writeFileSync(output, csvText, "utf-8")
	if (writeUnprocessed) {
		fs.writeFileSync(
			output + ".unprocessedNodes.json",
			JSON.stringify(unprocessedNodes, null, 2),
			"utf-8"
		)
	}
}

module.exports = usfmToCsv
