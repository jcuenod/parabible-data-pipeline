#! /bin/sh

# git clone https://git.door43.org/unfoldingWord/en_ult.git source-repository
# npm i usfm-grammar --global

# Must be run from root of this repo with source-repository containing all the usfm files

rm -f csv-files/*
cd source-repository
for file in *.usfm
do
    echo $file
    usfm-grammar -l relaxed $file -o csv >> ../csv-files/$file.csv
done
cd ../


counter=0
for file in csv-files/*.csv
do
    ((counter++))
    if [ "$counter" -eq 1 ]; then
        # Only do this the first time (so we get the header)
        cat $file > ./data.csv
    else
        tail -n +2 $file >> ./data.csv
    fi
done

printf ".mode csv\n.import data.csv alignment" | sqlite3 output/data.sqlite