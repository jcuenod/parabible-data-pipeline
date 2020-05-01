import sys
from tf.app import use
import sqlite3
from rid_helper import passage_to_index

sqlFile = sys.argv[1]
jsonFile = sys.argv[2]

conn = sqlite3.connect(sqlFile)
c = conn.cursor()

# Remove checkout=local if you haven't updated the data files in a while
A = use('bhsa', hoist=globals(), checkout='local')


def nullifyNaAndEmptyAndUnknown(list_to_reduce):
    templist = list_to_reduce
    keys_to_remove = set()
    for key, value in templist.items():
        if value == "NA" or value == "" or value == "unknown":
            keys_to_remove.add(key)
    for key in keys_to_remove:
        templist[key] = None
    return templist

definite_qualities = {"det": "Y", "und": "N", "NA": None}
def maybe_is_definite(n):
    definiteness = F.det.v(L.u(n, otype='phrase_atom')[0])
    return definite_qualities[definiteness]

feature_functions = {
    "wid": lambda n: n,
    "text": lambda n: F.g_word_utf8.v(n),
    "trailer": lambda n: F.trailer_utf8.v(n),
    "qere": lambda n: F.qere_utf8.v(n),
    #REMOVE: "consonantal_root": lambda n: F.lex_utf8.v(n).replace('=', '').replace('/','').replace('[',''),
    "realized_lexeme": lambda n: F.voc_lex_utf8.v(L.u(n, otype='lex')[0]),
    "paradigmatic_lexeme": lambda n: F.g_lex_utf8.v(L.u(n, otype='lex')[0]),
    "gloss": lambda n: F.gloss.v(L.u(n, otype='lex')[0]),

    "part_of_speech": lambda n: F.sp.v(n),
    "person": lambda n: F.ps.v(n)[1],
    "number": lambda n: F.nu.v(n),
    "gender": lambda n: F.gn.v(n),
    "tense": lambda n: F.vt.v(n), # vt = verbal tense
    "stem": lambda n: F.vs.v(n), # vs = verbal stem

    "state": lambda n: F.st.v(n), # construct/absolute/emphatic

    "is_definite": lambda n: maybe_is_definite(n),

    #REMOVE: "g_uvf_utf8": lambda n: F.g_uvf_utf8.v(n),
    #REMOVE: "g_cons_utf8": lambda n: F.g_cons_utf8.v(n),
    
    "g_prs_utf8": lambda n: F.g_prs_utf8.v(n),
    "pron_suffix_number": lambda n: F.prs_nu.v(n),
    "pron_suffix_gender": lambda n: F.prs_gn.v(n),
    "pron_suffix_person": lambda n: F.prs_ps.v(n)[1],
    
    "has_pronominal_suffix": lambda n: "Y" if F.g_prs_utf8.v(n) != "" else None,
    "phrase_function": lambda n: F.function.v(L.u(n, otype='phrase')[0]),
    # TODO: "sdbh": lambda n: F.sdbh.v(n),
    # TODO: "lxx_lexeme": lambda n: F.lxxlexeme.v(n),
    # TODO: "accent": lambda n: F.accent.v(n),
    # TODO: "accent_quality": lambda n: F.accent_quality.v(n),
    # MAYBE: `rela` seems to be similar to `function` - might be worth adding
    # DON'T BOTHER: qere_trailer_utf8"
    "phrase_node_id": lambda n: L.u(n, otype="phrase")[0],
    "clause_node_id": lambda n: L.u(n, otype="clause")[0],
    "sentence_node_id": lambda n: L.u(n, otype="sentence")[0],
    "reference_node_id": lambda n: passage_to_index(T.sectionFromNode(n)),
}
def features(n):
    r = {}
    for feature in feature_functions.keys():
        try:
            value = feature_functions[feature](n)
            if value is not None and value != "NA" and value != "" and value != "unknown":
                r[feature] = value
        except:
            continue
    return r

# for k in TF.features.keys(): print(k)

def sql_type(key):
    return "INTEGER" if key.endswith("_node_id") else "TEXT"

drop_table_sql = """
DROP TABLE IF EXISTS words
"""
fields = list(feature_functions.keys())
fields.remove("wid")
field_sql = ",\n    ".join(f'{k} {sql_type(k)}' for k in fields)
create_table_sql = f"""
CREATE TABLE words (
    wid INTEGER PRIMARY KEY,
    {field_sql}
)
"""
c.execute(drop_table_sql)
c.execute(create_table_sql)

fields_values = ", ".join(fields)
def do_insert(values_string):
    insert_sql = f"""
    INSERT INTO words (wid, {fields_values}) VALUES
    {values_string}
    """
    c.execute(insert_sql)
    conn.commit()

def sqlify(w):
    if w is None:
        return "NULL"
    else:
        return '"' + str(w) + '"'

print("Writing word_features to json")
import json
with open(jsonFile, 'w') as outfile:
    json.dump(fields, outfile)

BATCH_SIZE = 50000
values = []
i = 0
print("Inserting values ...")
for n in F.otype.s('word'):
    w = features(n)
    wid = w["wid"]
    feature_list = ",".join(sqlify(w[k] if k in w else None) for k in fields)
    values.append(f"""
    ({wid}, {feature_list})
    """)
    i += 1
    if i % BATCH_SIZE == 0:
        do_insert(",".join(values))
        values = []
        print(" ... " + str(i))

if len(values) > 0:
    print(" ... " + str(i))
    do_insert(",".join(values))

conn.close()
print("Done!")

