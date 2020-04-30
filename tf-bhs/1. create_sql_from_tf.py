from tf.app import use
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

definite_qualities = {"det": 1, "und": 0, "NA": None}
def maybe_is_definite(n):
	definiteness = F.det.v(L.u(n, otype='phrase_atom')[0])
	return definite_qualities[definiteness]

feature_functions = {
	"wid": lambda n: n,
	"word": lambda n: F.g_word_utf8.v(n),
	"trailer": lambda n: F.trailer_utf8.v(n),
	"qere": lambda n: F.qere_utf8.v(n),
	#REMOVE: "consonantal_root": lambda n: F.lex_utf8.v(n).replace('=', '').replace('/','').replace('[',''),
	"realized_lexeme": lambda n: F.voc_lex_utf8.v(L.u(n, otype='lex')[0]),
	"paradigmatic_lexeme": lambda n: F.g_lex_utf8.v(L.u(n, otype='lex')[0]),
	"gloss": lambda n: F.gloss.v(L.u(n, otype='lex')[0]),

	"part_of_speech": lambda n: F.sp.v(n),
	"person": lambda n: int(F.ps.v(n)[1]),
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
	"pron_suffix_person": lambda n: int(F.prs_ps.v(n)[1]),
	
	"has_pronominal_suffix": lambda n: 1 if F.g_prs_utf8.v(n) != "" else 0,
	"phrase_function": lambda n: F.function.v(L.u(n, otype='phrase')[0]),
	# TODO: "sdbh": lambda n: F.sdbh.v(n),
	# TODO: "lxx_lexeme": lambda n: F.lxxlexeme.v(n),
	# TODO: "accent": lambda n: F.accent.v(n),
	# TODO: "accent_quality": lambda n: F.accent_quality.v(n),
	# MAYBE: `rela` seems to be similar to `function` - might be worth adding
	# DON'T BOTHER: qere_trailer_utf8.
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

for k in TF.features.keys(): print(k)

i = 0
for n in F.otype.s('word'):
	print(n, features(n))
	i += 1
	if i > 1000:
		break