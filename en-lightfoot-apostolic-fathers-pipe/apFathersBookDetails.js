// Note that many of these have a "prologue" chapter (i.e., chapter 0)
// This then has 1 "verse". Those that have 0 verses in their 0 element have no prologue

//TODO: figure out hermas
const books = [
    {
        name: '1 Clement',
        versesPerChapter: [1, 3, 8, 4, 13, 6, 4, 7, 6, 4, 7, 2, 8, 4, 5, 6, 17, 6, 14, 3, 12, 9, 8, 5, 5, 5, 3, 7, 4, 3, 8, 4, 4, 8, 8, 12, 6, 5, 4, 9, 5, 4, 5, 6, 5, 8, 9, 7, 6, 6, 6, 5, 4, 5, 4, 6, 16, 7, 2, 4, 4, 3, 3, 4, 1, 2]
    },
    {
        name: '2 Clement',
        versesPerChapter: [0, 8, 7, 5, 5, 7, 9, 6, 6, 11, 5, 7, 6, 4, 5, 5, 4, 7, 2, 4, 5]
    }, {
        name: "Barnabas",
        versesPerChapter: [0, 7, 10, 6, 14, 14, 19, 11, 7, 8, 12, 11, 11, 7, 9, 9, 10, 2, 2, 12, 2, 9
        ],
    }, {
        name: "Didache",
        versesPerChapter: [0, 6, 7, 10, 14, 2, 3, 4, 3, 5, 7, 12, 5, 7, 3, 4, 8],
    }, {
        name: "Diognetus",
        versesPerChapter: [0, 1, 10, 5, 6, 17, 10, 9, 11, 6, 8, 8, 9],
    }, {
        name: "Hermas",
        versesPerChapter: [/* hermas is a mess - seem to be different systems... */]
    }, {
        name: 'Ignatius to the Ephesians',
        versesPerChapter: [1, 3, 2, 2, 2, 3, 2, 2, 2, 2, 3, 2, 2, 2, 2, 3, 2, 2, 2, 3, 2, 2],
    }, {
        name: 'Ignatius to the Magnesians',
        versesPerChapter: [1, 2, 1, 2, 1, 1, 2, 2, 2, 2, 3, 1, 1, 2, 1, 1],
    }, {
        name: 'Ignatius to the Philadelphians',
        versesPerChapter: [1, 2, 2, 3, 1, 2, 3, 2, 2, 2, 2, 2],
    }, {
        name: 'Ignatius to Polycarp',
        versesPerChapter: [1, 3, 3, 2, 3, 2, 2, 3, 3],
    }, {
        name: 'Ignatius to the Smyrneans',
        versesPerChapter: [1, 2, 1, 2, 2, 3, 2, 2, 2, 2, 2, 3, 2, 2],
    }, {
        name: 'Ignatius to the Trallians',
        versesPerChapter: [1, 2, 3, 3, 2, 2, 2, 2, 2, 2, 1, 2, 3, 3],
    }, {
        name: 'Martyrdom of Polycarp',
        versesPerChapter: [1, 2, 4, 2, 1, 2, 2, 3, 3, 3, 2, 2, 3, 3, 3, 2, 2, 3, 3, 2, 2, 1, 4],
    }, {
        name: 'Epistle of Polycarp',
        versesPerChapter: [1, 3, 3, 3, 3, 3, 3, 2, 2, 2, 3, 4, 3, 2, 1]
    }
]