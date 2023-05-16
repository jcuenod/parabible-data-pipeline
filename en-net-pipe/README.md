# Data Source

| | Notes |
| --- | --- |
| **Content** | New English Translation |
| **Source** | <https://ebible.org/Scriptures/engnet_usfm.zip> |
| **Format** | USFM |
| **License** | Copyright © 1996-2016 Biblical Studies Press, L. L. C. Please see <a href='https://netbible.com/net-bible-copyright'>https://netbible.com/net-bible-copyright</a> for full NET Bible copyright and permissions information. |

## Content

### New English Translation

> The NET Bible (New English Translation) is a completely new translation of the Bible with 58,506 translators’ notes!
> <https://ebible.org/details.php?id=engnet&all=1>

## Notes on Running (these notes from another module, might not apply here)

The importer uses `execSync` to run the `usfm-grammar` node application (using `npx`). This was running into "out of memory" issues for me and so I run `npx` with `NODE_OPTIONS="--max-old-space-size=8192"`. This may mean that you need to run the script itself with expanded memory constraints.

Also, the source files have extra "|notes" (pipe notes). I had to manually delete a two notes from Obad to get it to build & cache the CSV properly. Both were in the first 20 lines and caused the build to fail.
