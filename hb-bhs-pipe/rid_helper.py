book_to_index = {
    "Genesis": 1,
    "Exodus": 2,
    "Leviticus": 3,
    "Numbers": 4,
    "Deuteronomy": 5,
    "Joshua": 6,
    "Judges": 7,
    "Ruth": 8,
    "1_Samuel": 9,
    "2_Samuel": 10,
    "1_Kings": 11,
    "2_Kings": 12,
    "1_Chronicles": 13,
    "2_Chronicles": 14,
    "Ezra": 15,
    "Nehemiah": 16,
    "Esther": 17,
    "Job": 18,
    "Psalms": 19,
    "Proverbs": 20,
    "Ecclesiastes": 21,
    "Song_of_songs": 22,
    "Isaiah": 23,
    "Jeremiah": 24,
    "Lamentations": 25,
    "Ezekiel": 26,
    "Daniel": 27,
    "Hosea": 28,
    "Joel": 29,
    "Amos": 30,
    "Obadiah": 31,
    "Jonah": 32,
    "Micah": 33,
    "Nahum": 34,
    "Habakkuk": 35,
    "Zephaniah": 36,
    "Haggai": 37,
    "Zechariah": 38,
    "Malachi": 39,
}

def passage_to_index(passage):
    if passage[0] not in book_to_index:
        print(passage)
        print(passage[0])
        raise IndexError('Try using the right kind of book names bro')
    return book_to_index[passage[0]] * 1000000 + int(passage[1]) * 1000 + int(passage[2])

