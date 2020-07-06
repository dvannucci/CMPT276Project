const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const multer = require('multer')

// Storgae destination for profile pictures, and the name of the picture.
const storage = multer.diskStorage({
  destination: (req, file, func) => {
    func(null, './pictures/')
  },
  filename: (req, file, func) => {
    func(null, file.originalname)
  }
})

// Only allowing jpeg or png files for profile pictures.
const fileFilter = (req, file, func) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg'){
    func(null, true)
  }
  else {
    func(null, false)
  }
}

// Adding the features outlined above to the multer object.
const pictures = multer({storage: storage, fileFilter: fileFilter})

const {Pool} = require('pg');
var pool;
pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:root@localhost/appdatabase'
})

app = express()

//setup for socket.io
const http = require('http').Server(express())
const server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
const io = require('socket.io').listen(server);

  app.use(express.json())
  app.use(express.urlencoded({extended:false}))
  app.use(express.static(path.join(__dirname, 'public')))
  app.use('/pictures', express.static('pictures'))
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')

  // Takes you to the login page whenever the app is opened.
  app.get('/', (req, res) => res.sendFile(__dirname + '/public/Login.html'))

  // Takes you to the registration page when the user clicks register from the login page.
  app.get('/register', (req,res) => {
    res.render('pages/Register')
  })

  // The homepage for every user, customized to their personal info.
  app.get('/home/:id', (req, res) => {
    var userPageQuery = `select * from users where id = ${req.params.id}`;

    pool.query(userPageQuery, (error, result) => {
      if(error)
        res.send(error)

      res.render('pages/userHomepage', result.rows[0])
    })

  })

  // Each users personal profile which can be accessed by clicking the users name in the top right corner of the navigaiton bar.
  app.get('/profile/:id', (req, res) => {

    if (req.query.valid == 'false'){
      if (req.query.field == 'pic'){
        var alert = {'alert' : 'pic'}
      }
      else{
        var alert = {'alert' : 'uname'}
      }
    }
    else {
      var alert = {'alert' : false}
    }

    var allQuery = `select * from users where id = ${req.params.id}`
    pool.query(allQuery, (error, result) => {
      if(error)
        res.send(error)

      var data = result.rows[0]

      res.render('pages/profile', {data, alert} )
    })

  })

  // The registration page that users will be directed to when they click the link on the login page to make an account.
  app.post('/registration',async (req,res)=> {
    var uname=req.body.my_username;
    var email=req.body.my_email.toLowerCase();
    var password1=req.body.my_password1;
    var password2=req.body.my_password2;

    if(password1!=password2){
      res.send("Passwords didn't match. Try again!!")
    }
    else{
    const client = await pool.connect();
    try{
    var insertQuery=`INSERT INTO users(id,name,email,password) VALUES(DEFAULT,'${name}','${email}','${password2}')`;
    const result = await client.query(insertQuery);
         client.release();
       } catch (err) {
         console.error(err);
         res.send("User has already registered with this email. Please use differnt email address" + err);
       }
        res.send(`Thanks for submitting application`);}
      });

  // This function accepts the login details from the user, and checks if they are in the database. If they are, it brings them to their homepage, if not, it sends an error message.
  app.post('/authentification',async (req,res)=> {
    var username=req.body.username;
    var upassword=req.body.mypassword;
    const client = await pool.connect();
    var selectQuery= `SELECT id, username, password FROM users WHERE username='${username}'`;
         pool.query(selectQuery,(error,result) =>{

           var results = {'rows': result.rows}
           if(Object.keys(results.rows).length===0 ){
             res.render('pages/Login');
           }
           else{
           if(results.rows[0].username==username && results.rows[0].password==upassword){
             res.redirect('/home/' + results.rows[0].id )
           }
           else{
             res.render('pages/wrongpassword');  // After user enters wrong password they will get rendered to this page
           }
         }
         })
      });

  // This function updates the users profile picture. If the picture is valid it will change, if not, and error will be sent.
  app.post('/pictureChoose/:id', pictures.single('profilePicture'), async (req, res) => {

    var valid = true
    if (!req.file){
      var pictureUpdate = `update users set picture = '/pictures/lang-logo.png' where id = ${req.params.id}`
      valid = false
    }
    else {
      var pictureUpdate = `update users set picture = '/${req.file.path}' where id = ${req.params.id}`
    }

    const client = await pool.connect()
    try {
      const result = await client.query(pictureUpdate)
      client.release()
    } catch (err){
      res.send(err)
    }

    res.redirect('/profile/' + req.params.id + '?valid=' + valid + '&field=pic')

  })

  // Similar to the /pictureChoose function, this allows the user to change their username if they wish.
  app.post('/usernameChange/:id', async (req, res) => {

    var checkDatabase = `select * from users where username = '${req.body.uname}'`

    pool.query(checkDatabase, (error, result) => {
      if(error)
        res.send(error)

      if((result.rows).length){
        res.redirect('/profile/' + `${req.params.id}` + '?valid=' + false + '&field=uname')
      }
    })

    var usernameChange = `update users set username = '${req.body.uname}' where id = ${req.params.id}`

    const client = await pool.connect()
    try {
      const result = await client.query(usernameChange)
      client.release()
    } catch (err){
      res.send(err)
    }

    res.redirect('/profile/' + `${req.params.id}` + '?valid=' + true)

  })

  //link to chat page
  app.get('/chat/:uname/:chatID', (req,res)=>{
    var uname =req.params.uname;
    var chatID = req.params.chatID;
    var getmessagesQuery = "SELECT * FROM messages where chatID = " + chatID + "ORDER BY time ASC; SELECT * FROM chats WHERE '" + uname +  "'= any(participants); SELECT * FROM users WHERE username = '" + uname + "'";
    pool.query(getmessagesQuery, (error,result) => {
      if (error)
        res.end(error);
      var mesData= {'mesInfo':result[0].rows,'chatInfo':result[1].rows, 'data':result[2].rows[0]}
      res.render('pages/chat',mesData);
    })
  })

  io.on('connection', (socket) => {
    console.log('user connected');

     //temporary ask for username
    socket.on('username', (username)=> {
      console.log(username);
      socket.username = username;
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

    socket.on("chat_message", (msg)=> {
      //broadcast message to everyone in port:5000 except yourself.
      socket.broadcast.emit("received", {name: socket.username , message: msg });

      var storemessageQuery = "INSERT INTO messages VALUES (1, default, '" + socket.username + "', " + "'" + msg + "')";
      pool.query(storemessageQuery, (error,result)=> {
      })

      socket.emit("chat_message", {name: socket.username , message: msg });
    });
  });
