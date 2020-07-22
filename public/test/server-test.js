var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../index');
var should = chai.should();

chai.use(chaiHttp);

describe('messages', function(){
    // all the tests associated with Users
    it('should add a new chat room with unique id', function(done){
        chai.request(server).post('/chat/create').send({'username':'tester mctesty', 'chatnameinput':'test group'})
            .end(function(error,res){
                res.should.have.status(200);
                res.should.be.json;
                done();
            });
    });
});