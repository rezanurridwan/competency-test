const http = require ('http')
const path = require ('path')
const express = require ('express')
const { dirname } = require('path')
const hbs = require ('hbs')


const app = express()
app.use(express.json())

app.use('/public', express.static(path.join(__dirname, 'public')));
app.set ('view engine', 'hbs')

hbs.registerPartials(__dirname + '/views/partials');


app.get ('/', function (request, response){
    const title = "Task Collections"

    response.render('index',{
        title : title
    })
})


const server = http.createServer(app);
const port = 3000;
server.listen(port);
console.debug('Server listening on port ' + port);
