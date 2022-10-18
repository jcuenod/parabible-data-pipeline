db="postgresql://postgres:toor@127.0.0.1:5432/parabible"
tables=( module_info ordering_index word_features parallel )
#tables=( module_info )

for t in "${tables[@]}"
do
	echo "$t"
	psql $db \
		-c "COPY $t TO STDOUT WITH DELIMITER ',' CSV HEADER FORCE QUOTE *;" \
		| zstd -o "./clickhouse-csvs/$t.csv.zst"
done


# Note that this CH query should return 0 results (or we module precedence bugs will kick in):
# select parallel_id, groupArray(versification_schema_id) ga from ordering_index group by parallel_id having length(ga) < 4;
