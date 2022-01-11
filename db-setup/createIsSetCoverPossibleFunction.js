const range = n => [...Array(n).keys()]

const createFunction = argCount =>
	`CREATE OR REPLACE FUNCTION is_set_cover_possible(${range(argCount).map(i => `arg${i} numeric[]`).join(", ")})
RETURNS boolean LANGUAGE plpython3u AS $$
args = [${range(argCount).map(i => `arg${i}`).join(", ")}]
args_as_sets = list(map(set, args))

def len_union(a):
    return len(set().union(*a))

if len_union(args_as_sets) < len(args_as_sets): return False
sorted_by_length=sorted(args_as_sets, key=lambda a:len(a))
for i in reversed(range(len(sorted_by_length))):
    if i >= len(sorted_by_length[i]):
        if len_union(sorted_by_length) < len(sorted_by_length):
            return False
    sorted_by_length.pop()
return True
$$;`

console.log(range(9).map(i => createFunction(i + 2)).join("\n\n"))
