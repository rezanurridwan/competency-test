const http = require ('http')
const path = require ('path')
const express = require ('express')
const { dirname } = require('path')
const hbs = require ('hbs')
const app = express()
const session = require('express-session')

app.use(express.json())
app.use(express.static('express'));

app.use(
    session(
      {
            cookie: {
            maxAge: 1000 * 60 * 60 * 2,
            secure: false,
            httpOnly: true
            },
            store: new session.MemoryStore(),
            saveUninitialized: true,
            resave: false,
            secret: 'secretkey'
        }
    )
)

app.use(function (request, response, next) {
    response.locals.message = request.session.message
    delete request.session.message
    next()
});

app.use('/public', express.static(path.join(__dirname, 'public')));
app.set ('view engine', 'hbs')

hbs.registerPartials(__dirname + '/views/partials');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({extended:false}))

const dbConnection = require('./connection/db');
const {response} = require('express');



var isLogin = false;

app.get ('/', function (request, response){
    const title = "Task Collections"

    response.render('index',{
        title : title,
        isLogin: request.session.isLogin
    })
})
app.get ('/login', function (request, response){
    const title = "Login"

    response.render('login',{
        title : title, 
        isLogin
    })
})

app.post ('/login', function (request, response){
    const { email, password } = request.body
    if (email == '' || password == '') {
      request.session.message = {
        type: 'danger',
        message: 'Please Insert Your  Correct Data !!'
      }
      return response.redirect('/login')
    }

    const query = `SELECT *, MD5 (password) AS password FROM users_tb WHERE email = "${email}" AND password="${password}"`
    dbConnection.getConnection(function (err, conn) {
      if (err) throw err;
      
      conn.query(query, function (err, results) {
          if (err) throw err

        if (results.length == 0) {
          request.session.message = {
            type: 'danger',
            message: 'Email and password does not exist or match'
          }
          response.redirect('/login')
        } else {
          request.session.message = {
            type: 'success',
            message: 'Your Account Successfully To Load !!'
          }

          request.session.isLogin = true;
          request.session.user = {
            id: results[0].id,
            email: results[0].email,
            name: results[0].name,
            photo: results[0].photo
          }
        }
        return response.redirect('/')
      })
    })
})

app.get ('/register', function (request, response){
    const title = "Register"

    response.render('register',{
        title : title,
        isLogin
    })
})
app.post('/register', function(request, response){

    const {username, email, password} = request.body
    if(email == '' || password == '' || username == ''){
        request.session.message = {
            type : 'danger',
            message:'Please Insert The Correct Data !!'
        }
        response.redirect('/register')
    }


    const query = `INSERT INTO users_tb (email, password, username) VALUES ("${email}","${password}", "${username}")`
    dbConnection.getConnection(function(err, conn){
        if(err) throw err


        conn.query(query, function(err, results){
            if(err) throw err
            request.session.message = {
                type : 'success',
                message:'Your Account Has Been Saved'
            }

           response.redirect('/register')

        });

    });
});
app.get('/logout', function (request, response){
    request.session.destroy()
    response.redirect('/')
})
app.get('/addtask', function(request, response){
    response.render('addtask', {
        isLogin: request.session.isLogin
    });
});

const server = http.createServer(app);
const port = 3000;
server.listen(port);
console.debug('Server listening on port ' + port);
