const bhs = require("./hb-bhs-pipe/main.js")


const words = bhs.word_iterator(0)
for (w of words) {
	console.log(w)
}
