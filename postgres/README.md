# Quick setup Postgres for `parabible-data-pipeline`

## Getting Started

You'll need docker. Then it's just a matter of:

```
./run.sh
```

## Exporting the data

You'll need the postgres client available on your local shell. The script is very simple so if it doesn't work, just fix it.

```
./dump.sh
```

This should generate `parabible_data.sql`. It will then gzip the output giving you a nice neat `parabible_data.sql.gz`. You're welcome.


## How to load the dump file

**Option 1**. To import .sql.gz into running pg instance:

```
gunzip -c parabible_data.sql.gz | psql -h 127.0.0.1 -U username db_name
```

**Option 2**. If using docker, it's easiest to put the sql file into `docker-entrypoint-initdb.d` in your Dockerfile.

```
ADD ["parabible_data.sql.gz", "/docker-entrypoint-initdb.d/"]
```
