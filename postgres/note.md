# How to load the dump file

**Option 1**. To import .sql.gz into running pg instance:

```
gunzip -c parabible_data.sql.gz | psql -h 127.0.0.1 -U username db_name
```

**Option 2**. If using docker, it's easiest to put the sql file into `docker-entrypoint-initdb.d` in your Dockerfile.

```
ADD ["parabible_data.sql.gz", "/docker-entrypoint-initdb.d/"]
```
