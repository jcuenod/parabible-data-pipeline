const exec = require('child_process').execSync

module.exports = code => JSON.parse(exec(`python parse.py ${code}`))

