# Readme

**Note: This is an active WIP**

## Usage:

Usage currently supported is:

```
DATABASE_URL="postgres://username:password@host:port/db" \
node main.js --reload-all
```

Modules are expected to be in subfolders in the root directory but one day this will also be an environmental variable.

Should prompt for password and clear database

Should fill with data from cache according to options

Possible options (in some imaginary future version):

```
  --reload-all   - Clear the db and do import each module.
  --load-new     - Check for available modules and load anything new.
  --load-one     - Expects a name as the next parameter. Deletes and reloads module.
  --clear-all    - Delete everything from the db.
```

## Requirements:

 - Node 12 (the last version better-sqlite3 works with)
 - Postgres database

You'll need to set up the modules on your own...

## Setting up a Database

If you have docker installed, setting up a database is easy. There is a `run.sh` script in the `/postgres` folder which executes a very simple docker command. It will create a pg database in a container called `parabible-db` and expose port `5432`. The default username/password is `admin@topsecret`; you may want to change those...

```
sh postgres/run.sh
```

Additionally, note that data will be stored in `postgres/data`.

## Modules

At this stage nomenclature is not consistent but it will stabilise (I think to "modules"). Eventually, individual modules will be broken out into their own repos but it started here so it's here for now. This means that the root `package.json` is full of packages that are actually there for the sake of particular modules rather than the main importer.

Modules that have at least partially functioning data ready for import include:

- [x] BHSA
- [x] Nestle1904
- [ ] SBLGNT
- [x] Rahlfs LXX (Using Stead's import)
- [ ] Swete LXX
- [x] UnfoldingWord Literal Translation
- [x] UnfoldingWord Simplified Translation
- [ ] NET
- [ ] ESV (charges a licensing fee)
- [x] JPS
- [x] CUNP (Chinese)
- [ ] RCUV (Chinese - seems like a good option)
- [ ] Spanish?
