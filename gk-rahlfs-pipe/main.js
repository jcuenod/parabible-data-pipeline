var { book_to_id } = require(__dirname + '/data/book_names.js')
// var Database = require('better-sqlite3')
var sqlite3 = require('sqlite3')

// var db = new Database(__dirname + '/data/biblecrawler.s3db')
// var dbLxx = new Database(__dirname + '/lxxproject/lxx.db')
var db = new sqlite3.Database(__dirname + '/data/biblecrawler.s3db')
var dbLxx = new sqlite3.Database(__dirname + '/output/lxx.db')

var { ParseCodeToObject } = require(__dirname + '/helpers/lxxparse/ParseCodeToObject.js')

//known missing verses:
// [ '240007028', '270005026' ]

//Set up mapping data
let failedRows = []
let versemap = {}
let reversemap = {}
const processParallelRow = (r) => {
	if (!r["LXXVerseID"] || !r["MTVerseID"])
	{
		failedRows.push(r)
		return
	}
	if (!versemap.hasOwnProperty(r["MTVerseID"]))
	{
		versemap[ r["MTVerseID"] ] = new Set()
	}
	if (!reversemap.hasOwnProperty(r["LXXVerseID"]))
	{
		reversemap[ r["LXXVerseID"] ] = new Set()
	}
	versemap[ r["MTVerseID"] ].add( r["LXXVerseID"] )
	reversemap[ r["LXXVerseID"] ].add( r["MTVerseID"] )
}
// better-sqlite3
// var x = db.prepare("SELECT * FROM parallel").all().forEach(r => {
// })
db.each("SELECT * FROM parallel", (err, row) => {
	if (row.SequenceNumber % 10000 === 0) console.log("::db    progress::", row.SequenceNumber)
	if (err) {
		console.log(err)
		process.exit()
	}
	processParallelRow(row)
}, () => tryDone("db"))

// Set up lxx data
const min_lxx_id = 500000 //there are 426,581 words in the wlc, this just pushes lxx wids higher
let lxx = {}
let lxx_word_data = {}
let unknownBooks = new Set()
let unknownVerses = new Set()
const getRid = (book, chapter, verse) => {
	const { bk, ch } = book_to_id(book, chapter)
	return bk * 10000000 + ch * 1000 + verse
}
const processContentRow = (r) => {
	if (book_to_id(r["book_name"]) !== -1) {
		const rid = getRid(r["book_name"], +r["chapter_nr"], +r["verse_nr"])
		if (rid) {
			if (!lxx.hasOwnProperty(rid))
				lxx[rid] = []
			const thiswid = min_lxx_id + r["id"]
			lxx[rid].push({
				wid: thiswid,
				text: r["word"]
			})
			// TODO: ensure there aren't blank values in return value here
			lxx_word_data[thiswid] = ParseCodeToObject(r["morph"])
			lxx_word_data[thiswid].lexeme = r["real_lemma"] ? r["real_lemma"] : r["word_root"]
			if (r["gloss"])
				lxx_word_data[thiswid].gloss = r["gloss"]
		}
		else {
			unknownVerses.add({
				book: r["book_name"],
				chapter: +r["chapter_nr"],
				verse: +r["verse_nr"]
			})
		}
	}
	else {
		if (!unknownBooks.has(r["book_name"])) {
			unknownBooks.add(r["book_name"])
		}
	}

}
// better-sqlite3
// dbLxx.prepare("SELECT * FROM content").all().forEach(r => {
// })
dbLxx.each("SELECT * FROM EnrichedContent", (err, row) => {
	if (row.id % 50000 === 0) console.log("::dblxx progress::", row.id)
	if (err) {
		console.log(err)
		process.exit()
	}
	processContentRow(row)
}, () => tryDone("dbLxx"))
console.log("Object.keys(lxx):", Object.keys(lxx).length)
console.log("Object.keys(lxx_word_data):", Object.keys(lxx_word_data).length)

const notYet = {
	"dbLxx": false,
	"db": false
}
const tryDone = (key) => {
	console.log(key)
	notYet[key] = true
	const all_ready = Object.keys(notYet).reduce((a, k) => a && notYet[k], true)
	if (!all_ready) return

	//Otherwise do the function:
	let lxx_verse_by_wlc_rid = {}
	let failures = 0
	let successes = 0
	const mapObj = Object.keys(versemap).forEach(v => {
		if (v == "MTVerseID") return // First line is bogus
		if (!v || !versemap[v])
			return

		const vToRid = (v) => {
			const matches = v.match(/(.+) (.+):(.+)/)
			// console.log(matches)
			const book = matches[1]
			const chapter = +matches[2]
			const verse = +matches[3]
			return getRid(book, chapter, verse)
		}
		const mt_id = vToRid(v)
		if (lxx_verse_by_wlc_rid.hasOwnProperty(mt_id)) {
			console.log("explosions!", mt_id)
			console.log("v", v)
			console.log("old", lxx_verse_by_wlc_rid[v])
			console.log("new", versemap[v])
			process.exit()
		}
		// console.log(versemap[v])
		lxx_verse_by_wlc_rid[mt_id] = {}
		versemap[v].forEach(vv => {
			if (vToRid(vv))
				lxx_verse_by_wlc_rid[mt_id][vv] = lxx[vToRid(vv)]
		})
	})
	console.log(Object.keys(lxx_verse_by_wlc_rid).length)
	
	console.log("transforming word data")
	const lxx_word_data_array = Object.keys(lxx_word_data).map(wid => ({ "wid": +wid, features: lxx_word_data[wid] }))

	console.log("writing files")
	const fs = require("fs")
	console.log(" - ./output/lxx_word_data.json")
	fs.writeFileSync("./output/lxx_word_data.json", JSON.stringify(lxx_word_data_array, null, 2), 'utf8')
	console.log(" - ./output/lxx_verse_by_wlc_rid.json")
	fs.writeFileSync("./output/lxx_verse_by_wlc_rid.json", JSON.stringify(lxx_verse_by_wlc_rid, null, 2), 'utf8')
	console.log(" - done")
}

// console.log("unknown books:", unknownBooks)
// console.log("unknown verses:", unknownVerses)
// module.exports = {
// 	async_lxx_word_data: () => {
// 		return donedone ? lxx_word_data : false
// 	},
// 	async_lxx_verse_by_wlc_rid: () => {
// 		return donedone ? lxx_verse_by_wlc_rid : false
// 	},
// 	// FOR TESTING PURPOSES:
// 	// failedRows,
// 	// unknownBooks,
// 	// unknownVerses,
// 	// versemap,
// 	// lxx
// }