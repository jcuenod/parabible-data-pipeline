# Alignment Data

The easiest data to use right now is simply the work by Michael Stead in Biblecrawler, which is easy to export and parse.

Right now it seems that the best data is probably STEPBible data. It provides a verse-by-verse mapping between the NRSV (?) and the "original". This means more work will need to be done to map the LXX (and JPS) but some of that data is in the repo (we'll just have to parse it and one of the advantages of this `.ods` was that it wouldn't require much work to transform). The problem is that it also handles sub-verses and I don't think we're ready for that kind of challenge.

On the other hand, the CCEL data does have LXX mappings. Perhaps the best thing to do is actually to make a comparison and see where they differ first.

Finally, it may also be worth checking <https://github.com/Copenhagen-Alliance/versification-specification>

## Standard Bible and Paratext 'original' Bible verse-by-verse.ods

| Filename | Standard Bible and Paratext 'original' Bible verse-by-verse.ods |
| --- | --- |
| Content | STEPBible Versification summary from differences between Hebrew, Latin and Greek, and NT early versification and NRSV |
| Author | David Instone-Brewer(?) |
| Source | <https://docs.google.com/spreadsheets/d/1gg3l-_LbTFKYdXEPrYMmEzqVNCOcawnVT1Kz42PUbQE> |
| Origin | <https://github.com/tyndale/STEPBible-Data> |

## references.sqlite

| Filename | references.sqlite |
| --- | --- |
| Content | Derived from CCEL mappings (but I can't find live sources for the original files any more) |
| Author | Adam Baker & CCEL |
| Source | <https://github.com/adamb924/references-in-sqlite> |
| Origin | [defunct] <http://www.ccel.org/refsys/refsys.html> |
