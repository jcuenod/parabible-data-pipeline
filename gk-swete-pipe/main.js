const fs = require("fs")
const exec = require("child_process").execSync

const swete_dir = `${__dirname}/lxx-swete`
console.log("Checking for Swete repo...")
if (!fs.existsSync(swete_dir)) {
	console.log(" - Not found, cloning...\n")
	const swete_repo = "https://github.com/jtauber/lxx-swete"
	exec(`cd ${__dirname} && git clone ${swete_repo}`)
}
else {
	console.log(" - found\n")
}

const normalize = w => 
	w.replace("’", "'")
	 .normalize("NFD").replace(/[\u0300-\u036f]/g, "")

console.log("importing rahlfs...")
let rahlfs = {};
{
	let rahlfsJson = require("../rahlfs-pipe/data/allwords.json")
	rahlfsJson.forEach(w => {
		const key = `${w.book_name}_${w.chapter_nr}_${w.verse_nr}_${w.word_nr}`
		rahlfs[key] = normalize(w.word)
	})
	delete rahlfsJson
}
console.log("done")
const find_word = ({book, ch, v, word_nr}) => {
	const key = `${book}_${ch}_${v}_${word_nr}`
	if (key in rahlfs) {
		return rahlfs[key]
	}
	console.log("Key not found:", key)
}

const files = fs.readdirSync(swete_dir)
files.filter(f => f.endsWith(".txt")).forEach(file => {
	console.log(file)
	const lines = fs.readFileSync(`${swete_dir}/${file}`, "utf-8").split("\n")
	const book = file.substring(3,6)
	let last_verse = 0
	let word_nr = 0
	lines.filter(l => !!l).forEach(l => {
		const lxx = l.split(/\s/)
		//console.log(lxx)
		const w = normalize(lxx[1])
		const ch = +lxx[0].substring(2,5).replace(/[·.,]*/g, "")
		const v = +lxx[0].substring(5,8)
		word_nr++
		if (last_verse !== v) {
			last_verse = v
			word_nr = 0
		}
		const rahlfs_word = find_word({book, ch, v, word_nr})
		if (rahlfs_word !== w) {
			console.log("NOT EQUAL:", rahlfs_word, "->", w)
		}
	})
	process.exit()
})
