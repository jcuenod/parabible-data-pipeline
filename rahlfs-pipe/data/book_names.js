const book_names = {
	"Gen": 1,
	"Exod": 2,
	"Lev": 3,
	"Num": 4,
	"Deut": 5,
	"Josh": 6, /*A*/ "JoshB": 6,
	"Judg": 7, /*A*/ "JudgA": 7,
	"Ruth": 8,
	"1Sam": 9, "1Sam/K": 9,
	"2Sam": 10, "2Sam/K": 10,
	"1Kgs": 11, "1/3Kgs": 11,
	"2Kgs": 12, "2/4Kgs": 12,
	"1Chr": 13,
	"2Chr": 14,
	"Ezra": 15, //Hmm
	"Neh": 16, //hmm
	"Esth": 17,
	"Job": 18,
	"Ps": 19,
	"Prov": 20,
	"Eccl": 21, "Qoh": 21,
	"Song": 22, "Cant": 22,
	"Isa": 23,
	"Jer": 24,
	"Lam": 25,
	"Ezek": 26,
	"Dan": 27, //DanOG, DanTh
	"Hos": 28,
	"Joel": 29,
	"Amos": 30,
	"Obad": 31,
	"Jonah": 32,
	"Mic": 33,
	"Nah": 34,
	"Hab": 35,
	"Zeph": 36,
	"Hag": 37,
	"Zech": 38,
	"Mal": 39
}
module.exports.book_to_id = (book, chapter = 0) => {
	if (book == "2Esd" || book == "2Esdr") {
		// Ezra + 1 for Nehemeiah if 2Esd 11-23 (cf. NETS prologue to 2Esd)
		const is_nehemiah = chapter > 10
		return {
			bk: 15 + (is_nehemiah ? 1 : 0),
			ch: is_nehemiah ? chapter - 10 : chapter
		}
	}
	else if (book_names.hasOwnProperty(book)) {
		return {
			bk: +book_names[book],
			ch: chapter
		}
	}
	return -1
}