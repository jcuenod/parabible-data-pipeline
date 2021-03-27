It seems as though there are no versification differences between the GNT and translations (check SBL 2 p. 265 for differences in the OT; no differences in the NT are listed). For this reason, I'm using the ULT to get a list of rids (the ULT includes translation of "missing" verses) and I'm generating a table with kjv and gnt rows.

It's a solution that is more than good enough until I discover any versification differences.

The list of ULT rids can be collected like this:

```
sqlite3 -header -csv output/data.sqlite "select rid from verse_text;" > ./rids.csv
```

To generate this data, a slight modification:

```
sqlite3 -header -csv output/data.sqlite \
"SELECT rid as kjv, rid as gnt \
 FROM verse_text \
 WHERE rid > 4000000 and rid < 67000000;" \
> ./nt_rids.csv
```

Then turn it the csv into a sqlite db:

```
printf ".mode csv\n.import nt_rids.csv alignment" | sqlite3 ult_align.sqlite
```