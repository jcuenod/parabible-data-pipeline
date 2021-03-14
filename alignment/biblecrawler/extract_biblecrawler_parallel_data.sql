-- TABLE: versification
-- (Versecode VARCHAR (10) DEFAULT NULL, VerseID VARCHAR (13) NOT NULL, Book VARCHAR (7) DEFAULT NULL, Chapter INT (10) DEFAULT NULL, Verse INT (10) DEFAULT NULL, VerseIDORG VARCHAR (15) DEFAULT NULL, ORGChapter INT (10) DEFAULT NULL, ORGVerse INT (10) DEFAULT NULL, VerseIDLXX VARCHAR (15) DEFAULT NULL, LXXBook VARCHAR (7) DEFAULT NULL, LXXChapter INT (10) DEFAULT NULL, LXXVerse INT (10) DEFAULT NULL, VerseIDVul VARCHAR (15) DEFAULT NULL, VULChapter INT (10) DEFAULT NULL, VULVerse INT (10) DEFAULT NULL, VersecodeORG VARCHAR (10) NOT NULL, VersecodeLXX VARCHAR (10) NOT NULL, VersecodeVUL VARCHAR (10) NOT NULL);

-- Versecode, VerseID, Book, Chapter, Verse, VerseIDORG, ORGChapter, ORGVerse, VerseIDLXX, LXXBook, LXXChapter, LXXVerse, VerseIDVul, VULChapter, VULVerse, VersecodeORG, VersecodeLXX, VersecodeVUL1





-- 
-- TO EXECUTE:
-- sqlite3 -header -csv ../../BibleCrawler.s3db  < extract_biblecrawler_parallel_data.sql > data.csv
-- 


DROP TABLE IF EXISTS versification_for_parabible;

CREATE TABLE versification_for_parabible AS SELECT Versecode as kjv, VersecodeORG as bhs, VersecodeORG as gnt, VersecodeLXX as lxx, VersecodeVUL as vul FROM versification;

UPDATE versification_for_parabible SET bhs = "" WHERE CAST(kjv as INTEGER) >= 100000000;
UPDATE versification_for_parabible SET gnt = "" WHERE CAST(kjv as INTEGER) < 100000000;

SELECT * FROM versification_for_parabible;

DROP TABLE IF EXISTS versification_for_parabible;