const fs = require("fs")

const files = fs.readdirSync("./source-repository", "utf8")
const usfm_files = files.filter(f => f.endsWith(".usfm"))

const sqlite = require("sqlite")
const verse_to_sqlite = () => {
	db.
}
usfm_files.forEach()
