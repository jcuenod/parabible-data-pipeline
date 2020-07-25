// If `./source-repository` does not exist...
const clone_repo_command = `git clone https://git.door43.org/unfoldingWord/en_ust.git source-repository`

const fs = require("fs")

const files = fs.readdirSync("./source-repository", "utf8")
const usfm_files = files.filter(f => f.endsWith(".usfm"))

const sqlite = require("sqlite")
const verse_to_sqlite = () => {
	db.
}
usfm_files.forEach()
