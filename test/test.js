var mocha = require('mocha'),
  chai = require('chai'),
  assert = chai.assert,
  conf = require('./../config/convict.js'),
  request = require('supertest'),
  sails = require('sails'),
  userMock = require('./mocks/userMock.js'),
  quake = require('quake-sdk'),
  decisionApp = require('express')(),
  user,
  server,
  app;

function post (path) { // Post with authorization token header
  return request(app).post(path).set('authorization', global.quakeSDKHeader);
}

function get (path) { // Get with authorization token params
  return request(app).get(path).query({access_token: global.quakeSDKToken}).query({token_type: 'bearer'});
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //Allow https testing with self-signed certs

suite('Auth', function() {
  suiteSetup(function(done) {
    decisionApp.use(quake.middleware.decision);
    server = decisionApp.listen(conf.get('quiver_port'));

    sails.lift({
      port: conf.get('port')
    }, function() {
      app = sails.sails.express.app;
      quake.auth.getToken('quiver', null, null, function (token, header) {
        global.quakeSDKHeader = header;
        global.quakeSDKToken = token;
        done();
      });
    });
  });

  suiteTeardown(function(done) {
    server.close();
    sails.lower();
    done();
  });


  test('Auth should fail at / route without token', function(done) {
    request(app).get('/').end(function (err, res) {
      assert.equal(res.text, 'Unauthorized', 'Auth should fail at / route without token');
      done();
    });
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

        token.send({grant_type: 'authorization_code', code: code, client_id: conf.get('client_id'), client_secret: conf.get('client_secret'), redirect_uri: redirectURI}).end(function(err, res) {
          var tokenParams = JSON.parse(res.text);

          assert.isNotNull(tokenParams.access_token, 'Access token should be present');
          assert.equal(tokenParams.token_type, 'bearer', 'Token type should be bearer');
          done();
        });

      });
    });
  });

  test('findOrCreate route should create an identical new user', function(done) {
    post('/user/findOrCreate').send(userMock).end(function (err, res) {
      user = JSON.parse(res.text);
      assert.equal(userMock.id, user.providerID, 'findOrCreate route should create an identical new user');
      assert.equal(user.clientID.length, 36 , 'New user should have a clientID');
      assert.equal(user.clientSecret.length, 36 , 'New user should have a clientSecret');
      done();
    });
  });

  test('Auth as the new user', function(done) {
    quake.auth.getToken(user.id, user.clientID, user.clientSecret, function (token, header) {
      assert.equal(token.length, 36 , 'Should return user token');
      done();
    });
  });

  test('Remove user that was just found or created', function (done) {
    get('/user/destroy/' + user.id).end(function (err, res) {
      var destroyed = JSON.parse(res.text);
      assert.equal(user.id, destroyed.id, 'Remove user that was just found or created');
      done();
    })
  });
});