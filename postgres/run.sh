#! /bin/sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

docker run -d \
    --name parabible-db \
    -e POSTGRES_PASSWORD=topsecret \
	-e POSTGRES_USER=admin \
	-e POSTGRES_DB=parabible \
    -v $DIR/data:/var/lib/postgresql/data \
	-p 5432:5432 \
    postgres:9-alpine
