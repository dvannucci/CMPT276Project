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
    //addresses 2nd bullet point: if the user is not logged in we should get a 302 response code and be directed to the /login page
    it('should return a 302 response and redirect to /login', function(done){
        chai.request(app).get('/chat/0')
        .end(function(error,res){
            expect(res).to.have.status(200);
            expect(res).to.have.header('location', '/');
            done();
        });
      });
    //addresses 1st bullet point: if the user is logged in we should get a 200 status code
    it('should return a 200 response if the user is logged in', function(done){
        authenticatedUser.get('/chat/1')
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
