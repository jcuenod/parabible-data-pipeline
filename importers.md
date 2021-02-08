# Importer

An importer produces a sqlite database at `output/<version>.sqlite` to be consumed by `main.js`.

The schema for `<version>.sqlite` is as follows:

| field | description |
|---|---|
| version_id | The version id of the corpus |
| wid | The word's id (relative to this version) |
| text | The word as it should be rendered |
| prefix | Any punctuation etc. that precedes the word |
| trailer | Any punctuation etc. that succeeds the word |
| *attribute* | Word attributes |
| *syntax*_node | `sentence`, `clause`, `phrase`, `verse`  |
| parallel_id | Versioned parallel id |

The importer will add a `unversioned_parallel_id` based on the version (which indicates the versification system—for versification systems, see below). To generate a `parallel_id`, use `alignment/generate_versification_versioned_parallel_id.js`, passing in a reference to get an id.

## Versification systems:

 - KJV
 - BHS
 - LXX
 - GNT
