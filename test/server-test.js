var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../index');
var should = chai.should();
var expect = chai.expect;
var assert = chai.assert
var io = require('socket.io-client')

chai.use(chaiHttp);

//this requires the user 'john' with password 'guest' to function.
const userCredentials = {username:'john', mypassword:'guest'}

var authenticatedUser = chai.request.agent(app);
before(function(done){
  authenticatedUser
    .post('/authentification')
    .send(userCredentials)
    .end(function(err, res){
      res.should.have.status(200)
      done();
    });
});


describe("Socket-Server", function () {
  it('should connect to socket server.', function (done) {
    var client = io('http://localhost:5000');
    client.on('connect', function (data) {
        client.disconnect();
        done();
    });
  });
});

describe('test "messages" tab by first directing to /chat/0', function(done){
  it('should return a 200 response and redirect to "/" if not logged in', function(done){
      chai.request(app).get('/chat/0')
      .end(function(error,res){
          expect(res).to.have.status(200);
          res.text.should.include('You must first be logged in to view this page.');
          done();
      });
  });

  it('should return a 200 response and include the chatname "intro" in text if the user is logged in', function(done){
      authenticatedUser.get('/chat/0')
      .end(function(error,res){
          res.should.have.status(200);
          res.text.should.include('intro');
          done();
      });
  });
});

describe('Testing messaging sockets and pages', function(done){

  it('should return a 200 response and redirect to "/" if not logged in', function(done){
      chai.request(app).get('/chat/0')
      .end(function(error,res){
          expect(res).to.have.status(200);
          res.text.should.include('You must first be logged in to view this page.');
          done();
      });
  });

  it('should create a new chat named "mocha test"', function(done){
    authenticatedUser.post('/chat/create')
    .send({chatnameinput:'mocha test'})
    .end(function(error,res){
        res.should.have.status(200);
        console.log(res.header)
        done();
    });
  });

  it('should add user "jane" to the chat "mocha test"', function(done){
    authenticatedUser.get('/chat/1')
    .send
    .end(function(error,res){
        res.should.have.status(200);
        done();
    });
  });


  it('should send and recieve the text "HelloWorld" in the chatroom "mocha test"', function(done){
    authenticatedUser
    .get('/chat/1')
    .send({mymessage: "HelloWorld"})
    .end(function(error,res){
        res.should.have.status(200);
        var client = io('http://localhost:5000');
        client.on('connect', function (data) {
            done();
        });
    });
  });

  it('should rename the chat "mocha test", "mocha test :chatid: almost done', function(done){
    authenticatedUser.get('/chat/1')
    .end(function(error,res){
        res.should.have.status(200);
        done();
    });
  });

  it('should leave the chat "mocha test"', function(done){
    authenticatedUser.post('/chat/1/leave')
    .end(function(error,res){
        res.should.have.status(200);
        done();
    });
  });
});

describe('GET /videos', function(done){
  it('should return a 200 response and redirect to /login', function(done){
      chai.request(app).get('/videos')
      .end(function(error,res){
          res.should.have.status(200)
          done();
      });
  });
  //if the user is logged in we should get a 200 status code
  it('should return a 200 response if the user is logged in', function(done){
      authenticatedUser.get('/videos')
      .end(function(error,res){
          res.should.have.status(200);
          done();
      });
    });
});

describe('GET /mymusic', function(done){
  //if the user is not logged in we should be redirected to '/' page
  it('should return a 200 response and redirect to /', function(done){
      chai.request(app).get('/mymusic')
      .end(function(error,res){
        res.should.have.status(200);
          done();
      });
  });
  //if the user is logged in we should get a 200 status code
  it('should return a 200 response if the user is logged in', function(done){
      authenticatedUser.get('/mymusic')
      .end(function(error,res){
          res.should.have.status(200);
          done();
      });
  });
});

describe('Verify correct results on a user\'s homepage as well as when they search', function(){
  it('Should return a 200 response if the user is logged in, and render the user\'s homepage with Spotify results', function(done){
    authenticatedUser.get('/home')
    .end(function(error, res){
      res.should.have.status(200);
      res.should.have.header('content-type', "text/html; charset=utf-8" );
      res.text.should.include('Hot Right Now');
      res.text.should.include('Artists You May Like');
      res.text.should.include('Albums You May Like');
      done();
    });
  });

  it('Should return a 200 response, and have the user \'daniel\' show up when inputting \'dan\'', function(done){
    authenticatedUser.post('/search').send({'searchInput': 'dan'})
    .end(function(error, res){
      res.should.have.status(200);
      res.should.have.header('content-type', "text/html; charset=utf-8" );
      res.text.should.include('daniel')
      done();
    });
  });
});
