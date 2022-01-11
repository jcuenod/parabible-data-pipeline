CREATE EXTENSION IF NOT EXISTS plpython3u;

CREATE OR REPLACE FUNCTION is_set_cover_possible(arg0 numeric[], arg1 numeric[])
RETURNS boolean LANGUAGE plpython3u AS $$
args = [arg0, arg1]
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
$$;

CREATE OR REPLACE FUNCTION is_set_cover_possible(arg0 numeric[], arg1 numeric[], arg2 numeric[])
RETURNS boolean LANGUAGE plpython3u AS $$
args = [arg0, arg1, arg2]
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
$$;

CREATE OR REPLACE FUNCTION is_set_cover_possible(arg0 numeric[], arg1 numeric[], arg2 numeric[], arg3 numeric[])
RETURNS boolean LANGUAGE plpython3u AS $$
args = [arg0, arg1, arg2, arg3]
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
$$;

CREATE OR REPLACE FUNCTION is_set_cover_possible(arg0 numeric[], arg1 numeric[], arg2 numeric[], arg3 numeric[], arg4 numeric[])
RETURNS boolean LANGUAGE plpython3u AS $$
args = [arg0, arg1, arg2, arg3, arg4]
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
$$;

CREATE OR REPLACE FUNCTION is_set_cover_possible(arg0 numeric[], arg1 numeric[], arg2 numeric[], arg3 numeric[], arg4 numeric[], arg5 numeric[])
RETURNS boolean LANGUAGE plpython3u AS $$
args = [arg0, arg1, arg2, arg3, arg4, arg5]
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
$$;

CREATE OR REPLACE FUNCTION is_set_cover_possible(arg0 numeric[], arg1 numeric[], arg2 numeric[], arg3 numeric[], arg4 numeric[], arg5 numeric[], arg6 numeric[])
RETURNS boolean LANGUAGE plpython3u AS $$
args = [arg0, arg1, arg2, arg3, arg4, arg5, arg6]
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
$$;

CREATE OR REPLACE FUNCTION is_set_cover_possible(arg0 numeric[], arg1 numeric[], arg2 numeric[], arg3 numeric[], arg4 numeric[], arg5 numeric[], arg6 numeric[], arg7 numeric[])
RETURNS boolean LANGUAGE plpython3u AS $$
args = [arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7]
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
$$;

CREATE OR REPLACE FUNCTION is_set_cover_possible(arg0 numeric[], arg1 numeric[], arg2 numeric[], arg3 numeric[], arg4 numeric[], arg5 numeric[], arg6 numeric[], arg7 numeric[], arg8 numeric[])
RETURNS boolean LANGUAGE plpython3u AS $$
args = [arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8]
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
$$;

CREATE OR REPLACE FUNCTION is_set_cover_possible(arg0 numeric[], arg1 numeric[], arg2 numeric[], arg3 numeric[], arg4 numeric[], arg5 numeric[], arg6 numeric[], arg7 numeric[], arg8 numeric[], arg9 numeric[])
RETURNS boolean LANGUAGE plpython3u AS $$
args = [arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9]
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
$$;