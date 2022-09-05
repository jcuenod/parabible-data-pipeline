db="postgresql://postgres:toor@127.0.0.1:5432/parabible"
tables=( module_info ordering_index word_features parallel )
#tables=( module_info )

for t in "${tables[@]}"
do
	echo "$t"
	psql $db \
		-c "COPY $t TO STDOUT WITH DELIMITER ',' CSV HEADER;" \
		| gzip \
		> "./clickhouse-csvs/$t.csv.gz"
done
