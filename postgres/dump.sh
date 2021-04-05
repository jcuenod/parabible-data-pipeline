#! /bin/sh

pg_dump -h 127.0.0.1 -U postgres parabibledb > parabible_data.sql
gzip parabible_data.sql
