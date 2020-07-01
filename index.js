const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

const multer = require('multer')

const storage = multer.diskStorage({
  destination: (req, file, func) => {
    func(null, './pictures/')
  },
  filename: (req, file, func) => {
    func(null, file.originalname)
  }
})

const fileFilter = (req, file, func) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg'){
    func(null, true)
  }
  else {
    func(null, false)
  }
}

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
        res.end(error)
      var person = {'theUser': result.rows[0]}

      res.render('pages/profile', {person, alert})
    })


  })

  app.post('/pictureChoose', pictures.single('profilePicture'), (req, res) => {

    var alert = true
    if (!req.file){
      var pictureUpdate = `update users set profilePicture = 'pictures/lang-logo.png' where uid = 1`
      alert = false
    }
    else {
      var pictureUpdate = `update users set profilePicture = '${req.file.path}' where uid = 1`
    }

    pool.query(pictureUpdate, (error, result) => {
      if (error)
        res.end(error)
    })


    setTimeout(function(){res.redirect('/profile?valid=' + alert )}, 50)

  })

  app.post('/usernameChange', (req, res) => {

    var usernameChange = `update users set username = '${req.body.uname}' where uid = 1`

    pool.query(usernameChange, (error, result) => {
      if(error)
        res.end(error)
    })

    res.redirect('/profile')
  })

  //link to chat page
  app.get('/chat', (req,res)=>{
    res.render('pages/chat');
  })

  io.on('connection', (socket) => {
    console.log('user connected');

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

    socket.on("chat_message", (msg)=> {
      console.log("message: "  +  msg);
      //broadcast message to everyone in port:5000 except yourself.
      socket.broadcast.emit("received", { message: msg  });
    });
  });
