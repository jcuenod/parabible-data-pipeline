# Data Source

| | Notes |
| --- | --- |
| **Content** | unfoldingWord® Literal Text |
| **Source** | <https://git.door43.org/unfoldingWord/en_ult.git> |
| **Format** | Plain Text |
| **License** | [CC-BY-SA License](http://creativecommons.org/licenses/by-sa/3.0/) (see [LICENSE.md](https://git.door43.org/unfoldingWord/en_ult/src/branch/master/LICENSE.md) from repo) |

## Content

### unfoldingWord® Literal Text

> An open-licensed update of the ASV, intended to provide a ‘form-centric’ understanding of the Bible. It increases the translator’s understanding of the lexical and grammatical composition of the underlying text by adhering closely to the word order and structure of the originals.
> <https://www.unfoldingword.org/ult>


## Enrichments

- The ULT has translation notes (see the translation-notes subfolder)
- At times, the ULT has mappings to the underlying original languages (these mappings are packaged in the .usfm files)

## Notes on Running

The importer uses `execSync` to run the `usfm-grammar` node application (using `npx`). This was running into "out of memory" issues for me and so I run `npx` with `NODE_OPTIONS="--max-old-space-size=8192"`. This may mean that you need to run the script itself with expanded memory constraints.
