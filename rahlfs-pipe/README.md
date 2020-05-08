# LXX DATA PIPELINE

Combine LXX data from wherever it can be found for use on parabible.

---

## Introduction

This repository builds the LXX data used by Parabible. It draws from a number of different sources:

 - CCAT data from http://ccat.sas.upenn.edu/gopher/text/religion/biblical/lxxmorph/
 - Parallel data from Michael Stead's http://www.biblecrawler.org/
 - Lemma and gloss data from https://github.com/openscriptures/GreekResources.git

## Useful Data

This pipeline has been specifically designed with parabible in mind. There are a number of useful pieces of output along the way, however.

This is especially true of the generated `output/lxx.db`. This file is a sqlite3 database. Every row represents a word in the LXX. What is particularly useful about it is that it brings together formatted CCAT data (in unicode, not BETAcode) and the Lemma and Gloss data from OpenScriptures (see above).

You will also find a less intuitive json map of lxx verses by Hebrew verse reference in the output folder which is useful but a little more opaque.

## How to Use

You will need to locate `biblecrawler.s3db` on your own through the link to Michael Stead's BibleCrawler above. Place this file into the `/data` directory and you're good to go. Hopefully all you need to do now is:

```sh
    ./setup.sh
```