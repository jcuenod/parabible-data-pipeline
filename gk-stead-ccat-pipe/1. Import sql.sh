#! /bin/sh

gunzip lxxmorph.sql.gz
sqlite3 steadlxx.db < lxxmorph.sql
gzip lxxmorph.sql