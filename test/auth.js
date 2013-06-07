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
    var redirectURI = 'http://localhost:9000/auth/callback';
    request(app).get('/auth/authorize?client_id=' + conf.get('client_id') + '&response_type=code&redirect_uri=' + redirectURI).expect(200).expect('Content-Type', 'text/json').end(function(err, res) {
      var params = JSON.parse(res.text),
        decision = request(app).post('/auth/authorize/decision'),
        token = request(app).post('/auth/token'),
        cookies = res.headers['set-cookie'].pop().split(';')[0];


//      console.log(res.headers['set-cookie'].pop().split(';')[0]);
      //TODO Figure out why this cookie shuffle trick is throwing errors. See https://gist.github.com/joaoneto/5152248
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
});