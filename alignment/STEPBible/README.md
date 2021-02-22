
The source for this data is STEPBible. `Standard Bible and Paratext 'original' Bible verse-by-verse.ods` is the original (requested in relation to <https://github.com/tyndale/STEPBible-Data>)

Based on that filename, I believe the source is paratext, hence the csv filenames.

The `.ods` file is indiscriminate about original versions in the same source but does not, for example, consider the LXX for the OT. Thus I have extracted the data into these csvs.

To build `alignment.sqlite`:

```
npm i 
node main.js
```