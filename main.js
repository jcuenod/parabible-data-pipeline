const bhs = require("./hb-bhs-pipe/main.js")


const words = bhs.word_iterator({ node_offset: 0 })
for (let w of words()) {
	console.log(w)
}
