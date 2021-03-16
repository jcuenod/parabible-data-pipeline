-- 
-- TO EXECUTE:
-- sqlite3 -header -csv ./verity.sqlite < ./extract-bhs-net-from-verity-sqlite.sql > bhs-net.csv
-- 


SELECT 
	(b1.book_number * 1000000 + b1.chapter * 1000 + b1.verse) bhs, 
	(b2.book_number * 1000000 + b2.chapter * 1000 + b2.verse) net
FROM
	bibles b1,
	bibles b2
WHERE
	b1.parallel = b2.parallel AND
	b1.bibletext_id = 3 AND
	b2.bibletext_id = 1;
