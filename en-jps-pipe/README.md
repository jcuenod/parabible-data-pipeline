# Data Source

| | Notes |
| --- | --- |
| **Content** | JPS (1917) |
| **Source** | <https://ebible.org/details.php?id=engjps&all=1> |
| **Format** | XML with random nested elements |
| **License** | Public Domain |

## Content

### Jewish Publication Society Translation

The JPS translation is a standard Jewish translation that often differs from English translations in interesting ways. These divergences typically highlight alternative ways of reading the Hebrew that are always worth considering.

> The Open Siddur Project aims to produce a free software toolkit for making high-quality custom Jewish liturgical books such as haggadot, siddurim, and bentchers that can be displayed on screen or printed to paper.

> <https://github.com/opensiddur/opensiddur>

The text for the translation is available in [`/opensiddur-sources/sources/1917JPS/books/`](https://github.com/opensiddur/opensiddur/tree/develop/opensiddur-sources/sources/1917JPS/books). There's also a plain text file in the parent directory which may be easier to work with. It contains paragraphing and may split verses for that if necessary (I haven't checked)—there are a bunch of columns (including footnotes). It looks as though XML is the best bet though (also easier to determine when all the nested elements are accounted for). It is also available at ebible.org, though, and there it's in usfm.

### Enrichments

 - NB: Needed enrichment is going to be **alignment** because JPS is offset from NRSV and MT at certain points.
