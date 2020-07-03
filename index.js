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
  app.get('/', (req, res) => res.render('pages/index'))
  app.get('/myPage', (req, res) => {
    res.render('pages/userHomepage')
  })

  app.get('/profile', (req, res) => {

    if (req.query.valid == 'undefined' || req.query.valid == 'false'){
      var alert = {'alert' : false}
    }
    else {
      var alert = {'alert' : true}
    }

    var allQuery = 'select * from users'
    pool.query(allQuery, (error, result) => {
      if (error)
        res.send(error)
      var person = {'theUser': result.rows[0]}

      res.render('pages/profile', {person, alert})
    })

  })
  app.post('/register',async (req,res)=> {
    var name=req.body.my_name;
    var email=req.body.my_email.toLowerCase();
    var password1=req.body.my_password1;
    var password2=req.body.my_password2;

    if(password1!=password2){
      res.send("Password didn't match.Try again!!")
    }
    else{
    const client = await pool.connect();
    try{
    var insertQuery=`INSERT INTO Customer(id,name,email,password) VALUES(DEFAULT,'${name}','${email}','${password2}')`;
    const result = await client.query(insertQuery);
         client.release();
       } catch (err) {
         console.error(err);
         res.send("User has alraedy register with this email id. So please use differnt email id" + err);
       }
        res.send(`Thanks for submitting application`);}
      });

      app.post('/mypage',async (req,res)=> {
        var uemail=req.body.myemail;
        var upassword=req.body.mypassword;
        const client = await pool.connect();
        var selectQuery=`SELECT email,password FROM Customer WHERE email='${uemail}'`;
             pool.query(selectQuery,(error,result) =>{

               var results ={'rows': result.rows}
               /*if(results.rows[0].email!=uemail){
                 res.send("Please register before Login");
               }*/
               if(results.rows[0].email==uemail && results.rows[0].password==upassword){
                 res.send("Welcome to page");
               }
               else{
                 res.send("You have entered wrong password ");
               }
             })
    });

  app.post('/pictureChoose', pictures.single('profilePicture'), (req, res) => {

    var alert = true
    if (!req.file){
      var pictureUpdate = `update users set profilePicture = 'pictures/lang-logo.png' where uid = 1`
      alert = false
    }
    else {
      console.log("hey")
      var pictureUpdate = `update users set profilePicture = '${req.file.path}' where uid = 1`
    }

    pool.query(pictureUpdate, (error, result) => {
      if (error)
        res.send(error)
    })

    setTimeout(function(){res.redirect('/profile?valid=' + alert )}, 50)

  })

  app.post('/usernameChange', (req, res) => {

    var usernameChange = `update users set username = '${req.body.uname}' where uid = 1`

    pool.query(usernameChange, (error, result) => {
      if(error)
        res.send(error)
    })

    res.redirect('/profile')
  })

  //link to chat page
  app.get('/chat', (req,res)=>{
    var getmessagesQuery = 'SELECT * FROM messages ORDER BY time ASC';
    pool.query(getmessagesQuery, (error,result) => {
      if (error)
        res.end(error);
      var results = {'mesInfo':result.rows}
      res.render('pages/chat',results);
    })
  })

  io.on('connection', (socket) => {
    console.log('user connected');
    //temporary ask for username
    socket.on('username', function(username) {
      socket.username = username;
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

    socket.on("chat_message", (msg)=> {
      //broadcast message to everyone in port:5000 except yourself.
      socket.broadcast.emit("received", socket.username + " : " + msg);

      var storemessageQuery = "INSERT INTO messages VALUES (default, '" + socket.username + "', " + "'" + msg + "')";
      pool.query(storemessageQuery, (error,result)=> {
      })

      socket.emit("chat_message", socket.username + " : " + msg)

      // var getsentQuery = 'SELECT * FROM messages ORDER BY time DESC LIMIT 1';
      // pool.query(getsentQuery, (error,result) => {
      //   var results = {'mesInfo':result.rows[0]}
      //   var processedMsg = results.mesInfo.sender + " : " + results.mesInfo.message;
      //   socket.emit("chat_message", processedMsg);
      // })
    });
  });
