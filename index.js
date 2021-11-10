const http = require ('http')
const path = require ('path')
const express = require ('express')
const {dirname} = require('path')

const app = express()
app.use(express.json())

app.set ('view engine', 'hbs')


const server = http.createServer(app);
const port = 3000;
server.listen(port);
console.debug('Server listening on port ' + port);

hbs.handlebars.registerHelper('isAuth', function (value) {
    if (value == true) {
      return false;
    } else {
      return true;
    }
  });