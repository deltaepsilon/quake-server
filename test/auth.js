var mocha = require('mocha'),
  chai = require('chai'),
  assert = chai.assert,
  conf = require('./../config/convict.js'),
  request = require('supertest'),
  sails = require('sails'),
  app;

suite('Auth', function() {
  suiteSetup(function(done) {
    sails.lift({
      port: 1338
    }, function() {
      app = sails.sails.express.app;
      done();
    });
  });

  suiteTeardown(function(done) {
    sails.lower();
    done();
  });


  test('Auth should fail at / route', function(done) {
    request(app).get('/').expect(403, done);
  });


  test('Auth/authorize should return clientID from env vars', function(done) {
    request(app).get('/auth/authorize?response_type=code&redirect_uri=http://localhost:9000/auth/callback&client_id=' + conf.get('client_id')).expect(200).expect('Content-Type', 'text/json').end(function(err, res) {
      var params = JSON.parse(res.text),
        decision = request(app).post('/auth/authorize/decision');


//      console.log(res.headers['set-cookie'].pop().split(';')[0]);
      decision.cookies = res.headers['set-cookie'].pop().split(';')[0];
      console.log(decision.cookies);






      assert.equal(params.client.id, 'admin', 'auth/authorize with the core application client_id returns said client_id');

      decision.send({transaction_id: params.transaction_id}).end(function(err, res) {
//          console.log(cookie, '&&&&&&&&&&&&&&&&&&&&&&&&&');
//          console.log(res.headers.cookie, '((((((((((((((((((((((((((');
//          console.log(err, res);
        done();
      });

    });
  });
});