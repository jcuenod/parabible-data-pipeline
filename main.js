const help_message = `\
Parabible DB Importer:
--

 This importer accepts 4 commands:
 
  --reload-all   - Clear the db and do import each module.
  --load-new     - Check for available modules and load anything new
  --load-one     - Expects a name as the next parameter  
  --clear-all    - Delete everything from the db
 
 Modules are expected to be in the same folder as main and should contain:
  - output/module.json
  - output/data.sqlite
`
const options = [
	"--reload-all",
	"--load-new",
	"--load-one",
	"--clear-all",
]
const import_option = process.argv[2] || false
if (!import_option || !options.includes(import_option)) {
	console.log(help_message)
	process.exit()
}
if (import_option === "--reload-all") {
	require("./option-reload-all")
}
if (import_option === "--load-one") {
	require("./option-load-one")
}
else {
	console.log("Sorry, only --clear-all is currently supported.")
	process.exit()
}
