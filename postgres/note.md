# Import .sql.gz into running pg instance:
gunzip -c filename.sql.gz | psql -h 127.0.0.1 -U username db_name
