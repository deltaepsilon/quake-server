var defer = require('node-promise').defer,
  deferred = defer(),
  mocha = require('mocha'),
  chai = require('chai'),
  assert = chai.assert,
  conf = require('./../../config/convict.js'),
  request = require('supertest'),
  quake = require('quake-sdk'),
  quakeServer = require('./../utility/server.js'),
  quakeRoot = conf.get('quake_external'),
  userMock = require('./../mocks/userMock.js'),
  verbs,
  server,
  app,
  user;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //Allow https testing with self-signed certs

module.exports = function () {
  suite('User', function() {
    suiteSetup(function(done) {
      quakeServer.startApp(function (aserver, aapp, auser, atoken, aheader, auserToken, auserHeader) {
        server = aserver;
        app = aapp;
        user = auser;
        userToken = auserToken;
        verbs = require('./../utility/verbs.js')(app);
        done();
      })
    });

    suiteTeardown(function(done) {
      quakeServer.refreshUser().then(function () { //Refresh user because the quiver bearer token got destroyed during the last test
        quakeServer.cleanUser(user, function () {
          quakeServer.stopApp(server, function () {
            deferred.resolve(done);
          });
        });
      });

    });

    test('Auth should fail at / route without token', function(done) {
      request(app).get('/').end(function (err, res) {
        assert.equal(res.text, 'Unauthorized', 'Auth should fail at / route without token');
        done();
      });
    });



    test('findOrCreate route should create an identical new user', function(done) {
      verbs.post('/user/findOrCreate').send(userMock).end(function (err, res) {
        user = JSON.parse(res.text);
        assert.equal(userMock.id, user.providerID, 'findOrCreate route should create an identical new user');
        assert.equal(user.clientID.length, 36 , 'New user should have a clientID');
        assert.equal(user.clientSecret.length, 36 , 'New user should have a clientSecret');
        done();
      });
    });

    var userToken;
    test('Auth as the new user', function(done) {
      quake.auth.getToken(user.id, user.clientID, user.clientSecret, function (token, header) {
        userToken = token;
        assert.equal(token.length, 36 , 'Should return user token');
        done();
      });
    });

    test('PUT to /user/update/1 should return the edited user. The number in the path can be arbitrary.', function (done) {
      verbs.put('/user/update/', userToken).send({emails: [{value: "chris@quiver.is"}]}).end(function (err, res) {
        var updatedUser = JSON.parse(res.text);
        assert.equal('chris@quiver.is', updatedUser.emails[0].value, 'Email should be persisted to existing user');
        assert.equal(user.id, updatedUser.id, 'Updated user should have same ID');
        assert.isUndefined(updatedUser.clientID, 'updates should not pass back clientID');
        assert.isUndefined(updatedUser.clientSecret, 'updates should not pass back clientSecret');
        assert.isUndefined(updatedUser._json, 'updates should not pass back _json');
        assert.isUndefined(updatedUser._raw, 'updates should not pass back _raw');

        done();
      });
    });

    test('Auth/authorize should return clientID from env vars', function(done) {
      var redirectURI = quakeRoot + '/auth/callback';
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

          token.send({grant_type: 'authorization_code', code: code, client_id: conf.get('client_id'), client_secret: conf.get('client_secret'), redirect_uri: redirectURI}).end(function(err, res) {
            var tokenParams = JSON.parse(res.text);

            assert.isNotNull(tokenParams.access_token, 'Access token should be present');
            assert.equal(tokenParams.token_type, 'bearer', 'Token type should be bearer');
            done();
          });

        });
      });
    });

  });

  return deferred.promise;
}
