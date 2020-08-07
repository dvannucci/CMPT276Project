var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../index');
var should = chai.should();
var expect = chai.expect;
var assert = chai.assert
var io = require('socket.io-client')
const Browser = require('zombie');

var testchatpath;
var testchatid;

Browser.localhost('localhost:', 5000);

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


describe("Test Socket.io server properly connect and disconnect", function () {
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

describe('User logs in as "john"', function() {

  const browser = new Browser({runScripts: false});

  before(function(done) {
    browser.visit('/', function(){
      browser.fill('input[name=username]', 'john')
      browser.fill('input[name=mypassword]', 'guest')
      browser.pressButton('Login')
      browser.wait().then(done)
    });
  });

  describe('Navigate to messages tab', function() {

    before(function(done) {
      browser.visit('/chat/0', done);
    });


    describe('Testing create new chat functionality', function() {

      before(function(done) {
        browser.fill('input[name=chatnameinput]', 'zombie test')
        browser.pressButton('createbtn')
        browser.wait().then(done)
      });

      it('should be successful', function(done) {
        browser.assert.success();
        done()
      });

      it('should see confirmation page', function(done) {
        browser.assert.text('title', 'Confirm');
        done()
      });

      it('should return to newly made chatroom onclick', function(done) {
        browser.clickLink(".returntochat", function() {
          //link has been clicked and actions processed
          browser.assert.text('title', 'Messages');
          browser.assert.text('.chat_title', 'zombie test')
          testchatpath = browser.location.href
          testchatpath = testchatpath.replace('http://localhost', '')
          testchatid = testchatpath.replace('/chat/','')
          done()
        });
      });
    });
  })
});

describe("Test Socket.io adding user to chat events and listeners", function () {
  it('should successfully emit add participant event', function (done) {
    var client = io('http://localhost:5000');
    client.on('connect', function (data) {
      client.emit('username', 'john')
      client.emit('add_participant', {person: 'jane', chatID: testchatid, chatname:'zombie test' });
      client.disconnect();
      done();
    });
  });
});

describe("Test Socket.io sending message events and listeners", function () {
  it('should emit and recieve chat_message event in new chat', function (done) {
    var client = io('http://localhost:5000');
    client.on('connect', function (data) {
      client.emit('chat_message', {msg: 'hello world', chatID: testchatid});
        client.disconnect();
        done();
    });
  });
  it('should recieve chat_message event and print "hello world" to new chat', function (done) {
    authenticatedUser.get(testchatpath)
      .end(function(error,res){
          expect(res).to.have.status(200);
          res.text.should.include('hello world');
          done()
      })
  });
});

describe("Test Socket.io renaming chat events and listeners", function () {
  it('should emit change_chat_name event', function (done) {
    var client = io('http://localhost:5000');
    client.on('connect', function (data) {
      client.emit("change_chat_name", {oldname: 'zombie test', newname: 'rename test', chatID: testchatid});
        client.disconnect();
        done();
    });
  });
  it('should display new chat name', function (done) {
    authenticatedUser.get(testchatpath)
      .end(function(error,res){
          expect(res).to.have.status(200);
          res.text.should.include('rename test');
          done()
      })
  });
});



describe('User logs in as "john"', function() {

  const browser = new Browser({runScripts: false});

  before(function(done) {
    browser.visit('/', function(){
      browser.fill('input[name=username]', 'john')
      browser.fill('input[name=mypassword]', 'guest')
      browser.pressButton('Login')
      browser.wait().then(done)
    });
  });

  describe('Navigate to messages tab', function() {

    before(function(done) {
      browser.visit('/chat/0', done);
    });

    it('should be successful', function(done) {
      browser.assert.success();
      done()
    });

    it('should be be in chat "intro"', function(done) {
      browser.assert.text('.chat_title', 'intro')
      done()
    });

    describe('Click "rename test" on contacts list to check contacts functionality', function() {

      before(function(done) {
        browser.clickLink("rename test", function() {
          //link has been clicked and actions processed
          browser.wait().then(done)
        });
      });

      it('should be successful', function(done) {
        browser.assert.success();
        done()
      });

      it('should be in chatroom "rename test"', function(done) {
        browser.assert.text('.chat_title', 'rename test')
        done()
      });


      describe('Test leave chat functionality', function() {

        before(function(done) {
          browser.pressButton('leavebtn', function() {
            //link has been clicked and actions processed
            browser.wait().then(done)
          });
        });

        it('should be successful', function(done) {
          browser.assert.success();
          done()
        });

        it('should see confirmation message', function(done) {
          browser.assert.text('title', 'Confirm');
          done()
        });

        it('should return to "intro" chat upon clicking return', function(done) {
          browser.clickLink(".returntochat", function() {
            //link has been clicked and actions processed
            browser.assert.text('title', 'Messages');
            browser.assert.text('.chat_title', 'intro')
            done()
          });
        });
      });
    });
  })
});

describe("Test Alert tab availability", function () {
  it('should display new chat name', function (done) {
    authenticatedUser.get(testchatpath)
      .end(function(error,res){
          expect(res).to.have.status(200);
          res.text.should.include('rename test');
          done()
      })
  });
});

describe('User logs in as "john"', function() {

  const browser = new Browser({runScripts: false});

  before(function(done) {
    browser.visit('/', function(){
      browser.fill('input[name=username]', 'john')
      browser.fill('input[name=mypassword]', 'guest')
      browser.pressButton('Login')
      browser.wait().then(done)
    });
  });

  describe('Navigate to videos tab', function() {

    before(function(done) {
      browser.visit('/videos', done);
    });

    it('should be successful', function(done) {
      browser.assert.success();
      done()
    });

    it('should prompt to login to google account', function(done) {
      browser.assert.text('title', 'Google Login Link')
      done()
    });

    describe('Click link to login to google', function() {

      before(function(done) {
        browser.clickLink("Login", function() {
          //link has been clicked and actions processed
          browser.wait().then(done)
        });
      });

      it('should be successful', function(done) {
        browser.assert.success();
        done()
      });

      it('should be at official Google sign in page', function(done) {
        browser.assert.text('title', 'Sign in – Google accounts')
        done()
      });
    });
  })
});

describe('User logs in as "john"', function() {

  const browser = new Browser({runScripts: false});

  before(function(done) {
    browser.visit('/', function(){
      browser.fill('input[name=username]', 'john')
      browser.fill('input[name=mypassword]', 'guest')
      browser.pressButton('Login')
      browser.wait().then(done)
    });
  });

  describe('Navigate to videos tab', function() {

    before(function(done) {
      browser.visit('/videos', done);
    });

    it('should be successful', function(done) {
      browser.assert.success();
      done()
    });

    it('should prompt to login to google account', function(done) {
      browser.assert.text('title', 'Google Login Link')
      done()
    });

    describe('Click cancel button', function() {

      before(function(done) {
        browser.clickLink("Cancel", function() {
          //link has been clicked and actions processed
          browser.wait().then(done)
        });
      });
    
      it('should be successful', function(done) {
        browser.assert.success();
        done()
      });
    
      it('should be user personal home page', function(done) {
        browser.assert.text('title', "john's Homepage")
        done()
      });
    });
  })
});

describe('Testing Logging into Homepage', function(){

  it('Should return a 200 response if the user is logged in, and render the user\'s homepage.', function(done){
    authenticatedUser.get('/home')
    .end(function(error, res){
      res.should.have.status(200);
      res.should.have.header('content-type', "text/html; charset=utf-8" );
      done();
    });
  });

  it('Should return the user\'s homepage and include Spotify results', function(done){
    authenticatedUser.get('/home')
    .end(function(error, res){
      res.text.should.include('Hot Right Now');
      res.text.should.include('Artists You May Like');
      res.text.should.include('Albums You May Like');
      done();
    });
  });

  it('Should include our test user john\'s name on the homepage to access his profile', function(done){
    authenticatedUser.get('/home')
    .end(function(error, res){
      res.text.should.include('john');
      done();
    });
  });

  const browser = new Browser({runScripts: false});

  before(function(done) {
    browser.visit('/', function(){
      browser.fill('input[name=username]', 'daniel')
      browser.fill('input[name=mypassword]', '123')
      browser.pressButton('Login')
      browser.wait().then(done)
    });
  });

  it('Should allow the user to logout', function(done){
    browser.assert.element('a[id=confirmLogout]')
    done();
  });

});

describe('Testing Searching Functionality', function(){

  it('Should return a 200 response, and have the admin user \'daniel\' show up when inputting \'dan\'', function(done){
    authenticatedUser.post('/search').send({'searchInput': 'dan'})
    .end(function(error, res){
      res.should.have.status(200);
      res.should.have.header('content-type', "text/html; charset=utf-8" );
      res.text.should.include('daniel')
      done();
    });
  });

  it('Search result should return the song \'Jocelyn Flores\' when searching the phrase \'jo\'', function(done){
    authenticatedUser.post('/search').send({'searchInput': 'jo'})
    .end(function(error, res){
      res.text.should.include('Jocelyn Flores')
      done();
    });
  });

  it('Search result should include a google login button', function(done){
    authenticatedUser.post('/search').send({'searchInput': 'jo'})
    .end(function(error, res){
      res.text.should.include('Please login to Google to see Youtube results')
      done();
    });
  });

  describe('Able to rate songs/artists', function(){

    const browser = new Browser({runScripts: false});

    before(function(done) {
      browser.visit('/', function(){
        browser.fill('input[name=username]', 'daniel')
        browser.fill('input[name=mypassword]', '123')
        browser.pressButton('Login')
        browser.wait().then(done)
      });
    });

    before(function(done) {
        browser.fill('input[name=searchInput]', 'jo')
        browser.pressButton('Search')
        browser.wait().then(done)
    });

    it('Should allow the user to rate the songs/artists that show up from a search', function(done){
      browser.assert.elements('h3 a', { atLeast: 1 })
      done();
    });

  });


});

describe('Testings Profile Page Functionality', function(){

  const browser = new Browser({runScripts: false});

  beforeEach(function(done) {
    browser.visit('/', function(){
      browser.fill('input[name=username]', 'daniel')
      browser.fill('input[name=mypassword]', '123')
      browser.pressButton('Login')
      browser.wait().then(done)
    });
  })

  it('Should return a successful response when loading the user\'s profile page', function(done){
    browser.visit('/profile', function(){
      browser.assert.success();
      done();
    });
  });

  it('Should have forms to change the user\'s username and profile picture', function(done){
    browser.visit('/profile', function(){
      browser.assert.text('title', 'daniel\'s Profile')
      browser.assert.attribute('form', 'method', 'post')
      browser.assert.input('form input[name=profilePicture]', '')
      browser.assert.input('form input[name=uname]', '')
      done();
    });
  });

  it('Should have the option for the admin page for the admin user \'daniel\'', function(done){
    browser.visit('/profile', function(){
      browser.assert.text('button', 'Admin page')
      done();
    });
  });

  it('Should have the option to view all of the user daniel\'s favourite songs and artists', function(done){
    browser.visit('/profile', function(){
      browser.assert.input('#theSongs', 'songs')
      browser.assert.input('#theArtists', 'artists')
      done();
    });
  });

  it('Should have the option to view all of a user\s followers if they have any which the user \'daniel\' does', function(done){
    browser.visit('/profile', function(){
      browser.assert.text('title', 'daniel\'s Profile')
      browser.assert.attribute('form', 'method', 'post')
      browser.assert.input('form input[name=following]', 'Following')
      done();
    });
  });

  it('Should allow the user to view the music of the people they are following', function(done){
    authenticatedUser.get('/profile')
    .end(function(error, res){
      res.text.should.include('Your Friends Favourite Songs')
      done();
    });
  });

  it('Should allow the user to link their Spotify account to their Museical account', function(done){
    browser.visit('/profile', function(){
      browser.assert.text('title', 'daniel\'s Profile')
      browser.assert.attribute('form', 'method', 'post')
      browser.assert.input('form input[name=spotify]', 'Spotify')
      done();
    });
  });
});
