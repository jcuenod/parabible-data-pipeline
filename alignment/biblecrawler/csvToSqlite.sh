#! /bin/sh

rm alignment.db
sqlite3 alignment.db < create_table.sql

# Three commands, separated by \n, piped into interactive prompt
printf ".mode csv\n.import data.csv alignment" | sqlite3 alignment.db

sqlite3 alignment.db < create_index.sql