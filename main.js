const bhs = require("./tf-bhs/main.js")


const words = bhs.word_iterator()
for (w of words) {
	console.log(w)
}
