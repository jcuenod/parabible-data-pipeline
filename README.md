# Readme

**Note: this is a WIP but I think there's a good chance we'll get to something meaningful given the fact that <parabible.com> is already using this data...**

## Usage:

gonna be something like:

```
node main.js pgdb pgusername
```

Should prompt for password and clear database

Should fill with data from cache according to options

options:

`--rebuild <version> [<version>...]`

> Will rebuild <version> even if it finds cached stuff there. I have no intention of keeping track with whether the cached stuff is up to date with the latest coded version.

## Requirements:

 - Node (probably >= 6)
 - Python 3.6 (for tf-bhs)

## Attribution:

**Parallel Versification**:<br />
`references.sqlite` is derived from CCEL (but I can't find live sources for the original files any more) by Adam Baker at <https://github.com/adamb924/references-in-sqlite>.

**BHS (Tagged Hebrew [parsing + syntax trees])**:<br />
Eep Talstra Centre for Bible and Computer. See <https://etcbc.github.io/bhsa/>.

 - Accents: Work by Cody Kingham (<https://github.com/ETCBC/heads/blob/master/wordsets/accents.py>). See also <https://github.com/openscriptures/morphhb/blob/master/structure/OshbVerse/Script/AccentCatalog.js>.
