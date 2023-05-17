const Parser = require("tree-sitter");
const USFM3 = require("tree-sitter-usfm3");
const fs = require("fs");

const ReferenceParser = require("referenceparser").default;
const rp = new ReferenceParser();
const bookDetails = require("./bookDetails.json");
const _getBookInt = (book) => {
  const i = bookDetails.findIndex((d) => d.name === book) + 1;
  if (i < 0) {
    throw "Couldn't find book";
  } else {
    return i;
  }
};
const generateRid = (reference) => {
  const book = _getBookInt(reference.book) * 1000000;
  const ch = reference.chapter * 1000;
  const v = reference.hasOwnProperty("verse") ? reference.verse : 0;
  return book + ch + v;
};
const getRid = (ref) =>
  generateRid(rp.parse(ref));

// Prepare db for writing
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("output/data.sqlite");
db.serialize(() => {
  db.run("DROP TABLE IF EXISTS verse_text");
  db.run(
    "CREATE TABLE verse_text (rid INTEGER, text TEXT)",
  );
});

const INSERT_LIMIT = 50000;
const insertVerseJson = (verseJson) =>
  new Promise((resolve) => {
    while (verseJson.length > 0) {
      const insert = verseJson.splice(0, INSERT_LIMIT);
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const stmt = db.prepare(
          "INSERT INTO verse_text (rid, text) VALUES (?, ?)",
        );
        for (const row of insert) {
          stmt.run(row.rid, row.text);
        }
        stmt.finalize(resolve);
        db.run("COMMIT TRANSACTION");
      });
    }
  });

const parser = new Parser();
parser.setLanguage(USFM3);

const getBookcode = (node) => {
  if (node.type === "id") {
    return node.children[1].text;
  } else if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const found = getBookcode(node.children[i]);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

let currentChapter = 0;
let currentVerse = 1;
let verses = {};
let lastRef = "";
const traverse = (node, ancestors = []) => {
  if (ancestors.length === 0) {
    currentChapter = 0;
    currentVerse = 1;
    verses = {};
    lastRef = "";
  }
  //console.log(" ".repeat(ancestors.length * 2) + node.type);
  //console.log(verses);
  //if (counter++ > 61) {
  //	return;
  //}
  // console.log(" ".repeat(ancestors.length * 2) + node.type);
  const ref = currentChapter + ":" + currentVerse;
  if (node.type === "chapterNumber") {
    currentChapter = node.text;
    currentVerse = 1;
  } else if (node.type === "verseNumber") {
    if (lastRef !== "") {
      verses[lastRef] = verses[lastRef].trim();
    }
    currentVerse = node.text.trim();
    verses[currentChapter + ":" + currentVerse] = "";
  } else if (["paragraph", "q"].includes(node.type) && lastRef !== "") {
    if (!verses[lastRef].endsWith("<br />") && lastRef in verses) {
      verses[lastRef] = verses[lastRef].trim() + "<br />";
    }
  } else if (node.type === "text" && ancestors.includes("verseText")) {
    if (!(ref in verses)) {
      verses[ref] = "";
    }
    verses[ref] += node.text;
    lastRef = ref;
  }
  node.children.map((child) => {
    traverse(child, [...ancestors, node.type]);
  });
};

// Get all the usfm files in the directory
const files = fs.readdirSync("./source-files/bsb_usfm");

// Loop through the files and parse them
const processFile = async (file) => {
  console.log(file);
  const usfmText = fs.readFileSync("./source-files/bsb_usfm/" + file, "utf8");

  // const sourceCode = '\\id GEN\n\\c 1\n\\p\n\\v 1 In the begining..';
  const tree = parser.parse(usfmText);
  const book = getBookcode(tree.rootNode);

  traverse(tree.rootNode);
  const verseJson = Object.keys(verses).map((key) => {
    return {
      rid: getRid(`${book} ${key}`),
      text: verses[key],
    };
  });
  await insertVerseJson(verseJson);
};
(async () => {
  for (const file of files) {
    await processFile(file);
  }
  db.close();
})();

const module_info = {
  "name": "Berean Standard Bible",
  "abbreviation": "BSB",
  "description": "The BSB is a new dyanmic equivalent English translation.",
  "corpora": ["OT", "NT"],
  "versification_schema": "kjv",
  "license": "Public domain as of April 30, 2023",
  "url": "https://berean.bible/licensing.htm",
  "language": "en",
};
fs.writeFileSync("./output/module.json", JSON.stringify(module_info), "utf8");
