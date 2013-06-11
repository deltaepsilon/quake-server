var mocha = require('mocha'),
  chai = require('chai'),
  assert = chai.assert,
  conf = require('./../config/convict.js'),
  request = require('supertest'),
  sails = require('sails'),
  userMock = require('./mocks/userMock.js'),
  app;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //Allow https testing with self-signed certs

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
    var redirectURI = 'http://localhost:9000/auth/callback';
    request(app).get('/auth/authorize?client_id=' + conf.get('client_id') + '&response_type=code&redirect_uri=' + redirectURI).expect(200).expect('Content-Type', 'text/json').end(function(err, res) {
      var params = JSON.parse(res.text),
        decision = request(app).post('/auth/authorize/decision'),
        token = request(app).post('/auth/token'),
        cookies = res.headers['set-cookie'].pop().split(';')[0];

      decision.cookies = cookies;
      token.cookies = cookies;

      assert.equal(params.client.id, 'quiver', 'auth/authorize with the core application client_id returns said client_id');
      decision.send({transaction_id: params.transaction_id, user: 'quiver'}).expect(302).end(function(err, res) {
        if (err) { throw new Error(err); }

        var code = res.header.location.match(/code=(.+)/)[1];

        token.send({grant_type: 'authorization_code', code: code, client_id: conf.get('client_id'), client_secret: conf.get('client_secret')}).end(function(err, res) {
          var tokenParams = JSON.parse(res.text);

          assert.isNotNull(tokenParams.access_token, 'Access token should be present');
          assert.equal(tokenParams.token_type, 'bearer', 'Token type should be bearer');
          done();
        });

      });
    });
  });

  test('findOrCreate route should create an identical new user', function(done) {
    sails.sails.controllers.user.findOrCreate({query: {user: userMock}}, function (err, user) {
      assert.equal(userMock.id, user.providerID, 'findOrCreate route should create an identical new user');
      done();
    });
  });
});