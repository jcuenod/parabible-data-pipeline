# Version Modules

A version module supplies two files at `<module-name>/output/` to be consumed by the importer:

1. A json file with version information in `version.json`
1. A sqlite database called `<module-name>.sqlite`.

## `version.json`

The `version.json` file provides version information such as copyright details, etc. An example of the format is taken from the BHS tagged by ETCBC:

```
{
 "name": "Tagged BHS with Syntax Trees",
 "abbreviation": "ETCBC BHSA",
 "versification_schema": "bhs",
 "license": "Attribution-NonCommercial 4.0 International (<a href='https://creativecommons.org/licenses/by-nc/4.0/'>CC BY-NC 4.0</a>)",
 "url": "http://dx.doi.org/10.17026%2Fdans-z6y-skyh"
}
```

**Versification Schemas**

The versification schema enables the importer to align verses across versions. Available schemas include:

 - bhs
 - kjv
 - lxx

## `<module-name>.sqlite`

In the case of the BHS in the `version.json` above, if the root folder for the BHS importer is `hb-bhs-pipe`, the importer expects to find `hb-bhs-pipe/output/hb-bhs-pipe.sqlite`.

The schema for `<module-name>.sqlite` is as follows:

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

The importer will add a `unversioned_parallel_id` based on the versification schema in `version.json`. To generate a `parallel_id`, use `alignment/generate_versioned_parallel_id.js`, passing in a reference and the versification schema to get an id.

## Understanding Versification Schemas

Given a verse in a particular version, we need a way of finding a corresponding verse in some other version. To do this, the importer queries a sqlite database for alignment data to check, first, if there is any version already in the final database that has the matches the current node. If there are any results, the `unversioned_parallel_id` that is found to be in use for the aligned node is returned. Finding none, the `unversioned_parallel_id` is assigned as an autoincremented id.
