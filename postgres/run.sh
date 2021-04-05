#! /bin/sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Clear out old data
# cd $DIR
# rm -rf data

docker run -d \
    --name parabible-db-pg13-test \
    -e POSTGRES_PASSWORD=toor \
    -e POSTGRES_DB=parabibledb \
    -v $DIR/data:/var/lib/postgresql/data \
    -p 5432:5432 \
    postgres:13-alpine
