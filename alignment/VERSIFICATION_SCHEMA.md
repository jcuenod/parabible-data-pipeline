# Versification Schema

Each versification schema is imported in `generate_versification_versioned_parallel_id.js` and has an associated js file based on the name of the schema.

*Versification* files contain an array of objects in the form:

```
{
    { "name": "Genesis",   "abbreviation": "Gen",  "chapters": 50},
    { "name": "Exodus",    "abbreviation": "Exod", "chapters": 40},
    { "name": "Leviticus", "abbreviation": "Lev",  "chapters": 28},
    ...
}
```

Versification schemas must also be represented in `TODO.sqlite` so that `parallel_id`s can be generated.