# Readme

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

## Attribution:

**Parallel Versification**:<br />
`references.sqlite` is derived from CCEL (but I can't find live sources for the original files any more) by Adam Baker at <https://github.com/adamb924/references-in-sqlite>.

**BHS (Tagged Hebrew [parsing + syntax trees])**:<br />
Eep Talstra Centre for Bible and Computer. See <https://etcbc.github.io/bhsa/>.
