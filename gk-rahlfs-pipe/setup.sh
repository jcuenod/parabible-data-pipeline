# These helper libraries are needed for certain data or functionality
git clone https://github.com/jcuenod/lxxparse helpers/lxxparse
git clone https://github.com/openscriptures/GreekResources.git data/GreekResources

# Grab npm dependencies like sqlite etc.
npm install

# Grab CCAT files for output
node "helpers/1. get-lxx-files.js"
# Build output/lxx.db
node "helpers/2. enrich-ccat-to-lxxdb.js"

FILE="data/biblecrawler.s3db"
if [ -f $FILE ]; then
    # Bring in parallel data from biblecrawler.s3db and build word_map
    node "main.js"
else
   echo "ERR: You will need to download `biblecrawler.s3db` and place it in /data"
   echo "     main.js cannot run without this data."
fi
