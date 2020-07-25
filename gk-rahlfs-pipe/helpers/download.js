const http = require('http')
const fs = require('fs')

const download = (url, destination, callback) => {
  const file = fs.createWriteStream(destination)
  const request = http.get(url, (response) => {
    response.pipe(file)
    file.on('finish', () => {
      file.close(callback)
    })
  })
}
module.exports = download