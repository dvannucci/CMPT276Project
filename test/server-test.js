var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../index');
var should = chai.should();
var expect = chai.expect;
var assert = chai.assert

chai.use(chaiHttp);

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


describe('GET /chat/1', function(done){
  //if the user is not logged in we should be redirected to '/' page
  it('should return a 200 response and redirect to /', function(done){
      chai.request(app).get('/chat/1')
      .end(function(error,res){
          expect(res).to.have.status(200);
          done();
      });
  });
  //if the user is logged in we should get a 200 status code
  it('should return a 200 response if the user is logged in', function(done){
      authenticatedUser.get('/chat/1')
      .end(function(error,res){
          res.should.have.status(200);
          done();
      });
  });
});

describe('POST /chat/create', function(done){
  //if the user is not logged in we should be redirected to '/' page
  it('should return a 200 response and redirect to /', function(done){
      chai.request(app).post('/chat/create')
      .end(function(error,res){
        res.should.have.status(200);
          done();
      });
  });
  //if the user is logged in we should get a 200 status code
  it('should return a 200 response if the user is logged in', function(done){
      authenticatedUser.post('/chat/create')
      .send({chatnameinput:'test'})
      .end(function(error,res){
          res.should.have.status(200);
          done();
      });
  });
});

describe('POST /chat/1/leave', function(done){
  //if the user is not logged in we should be redirected to '/' page
  it('should return a 200 response and redirect to /', function(done){
      chai.request(app).post('/chat/1/leave')
      .end(function(error,res){
        res.should.have.status(200);
          done();
      });
  });
  //if the user is logged in we should get a 200 status code
  it('should return a 200 response if the user is logged in', function(done){
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
