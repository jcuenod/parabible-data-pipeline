# Data Source

| | Notes |
| --- | --- |
| **Content** | Nestle 1904 GNT with Clear Bible syntax trees, word sense data from UBS... |
| **Source** | <https://github.com/Clear-Bible/macula-greek/> |
| **Format** | XML |
| **License** | [CC BY 4.0](https://github.com/Clear-Bible/macula-greek/blob/main/LICENSE.md) |

## Content

### Nestle 1904

A version of the GNT used because it is old enough to be in the public domain. Has a lot of data built on it (e.g. comparisons to NA26/7/8). See, particularly, `/morph` for CSV data.

> The text has been augmented with morphological tags, lemmatization, and Strong's numbers by Dr. Ulrik Sandborg-Petersen of Scripture Systems, Denmark.
> <https://github.com/biblicalhumanities/Nestle1904/>

In addition, Clear Bible has enriched the data with syntax trees and word sense data. They also intend to continue enriching the data!

### Notes

This repo currently builds off the TSV. Syntactical data from the XML trees is not included.

### Enrichments

 - **Syntax Trees**: I will need to investigate how to make use of the trees as they are provided (Parabible only really supports shallow trees). Oliver Glanz(?) produced sentence and clause information from the punctuation published at https://github.com/CenterBLC/NA. It's unclear how useful this is.
 - **Glosses**: Note also, dictionaries by Dodson and Mounce can probably be mapped to Nestle1904 using strongs numbers.