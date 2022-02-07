const sqlite = require("better-sqlite3")
// Note, this path is relative to the parent folder
const db = new sqlite("./output/data.sqlite")

const lexemeUpdates = [
	{ from :"ἅλς", to: "ἅλας" },
]

lexemeUpdates.forEach(l => {
	db.exec(`UPDATE word_features
		SET lexeme = '${l.to}'
		WHERE lexeme = '${l.from}'`)
})
