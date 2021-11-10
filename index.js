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
  const query = `SELECT * FROM collections_tb`

  dbConnection.getConnection(function (err, conn) {
    if (err) throw err;

    conn.query(query, function (err, results) {
      if (err) throw err

      const collection = []

      for (let result of results) {
        collection.push({
          id: result.id,
          name: result.name
      });
      
    }

      response.render('index', {
        isLogin: request.session.isLogin,
        collection
      });
    });
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
app.post('/addtask', function(request, response){
  const {name} = request.body
  const userId = request.session.user.id;

      if (name == '') {
        request.session.message = {
          type: 'danger',
          message: 'Please insert all data !!'
        }

        response.redirect('/addtask')
      }
    
      const query = `INSERT INTO collections_tb (name) VALUES ("${name}")`

      dbConnection.getConnection(function (err, conn) {
        if (err) throw err;
     
        conn.query(query, function (err, results) {
          if (err) throw err;
    
          request.session.message = {
            type: 'success',
            message: 'Add movie has successfully'
          }
          response.redirect(`/detail/${results.insertId}`)
        })
      })
});
app.get('/detail/:id', function (request, response) {
  var id = request.params.id;

  const query = `SELECT * FROM collections_tb WHERE id = ${id}`

  dbConnection.getConnection(function (err, conn) {
    if (err) throw err;

    conn.query(query, function (err, results) {
      if (err) throw err

      const collection = {
        // id: results[0].id,
        name: results[0].name
      }

      var isContentOwner = false

      if (request.session.isLogin) {
        if (request.session.user.id == results[0].user_id) {
          isContentOwner = true
        }
      }

      response.render('detail', {
        isLogin: request.session.isLogin,
        collection,
        isContentOwner
      })

    })
  })
});
app.get('/edit-detail/:id', function (request, response) {
  const id = request.params.id
  const title = "Edit Detail" 


  const query = `SELECT * FROM collections_tb WHERE id = ${id}`

  dbConnection.getConnection(function (err, conn) {
    if (err) throw err;

    conn.query(query, function (err, results) {
      if (err) throw err

      const collection = {
        ...results[0],
      }

      response.render('editDetail', {
        title,
        isLogin: request.session.isLogin,
        collection
      })
    })
  })
});






app.get('/addtask/:id', function (request, response) {

      response.render('detail', {
        isLogin: request.session.isLogin,
      })

    })

const server = http.createServer(app);
const port = 3000;
server.listen(port);
console.debug('Server listening on port ' + port);
