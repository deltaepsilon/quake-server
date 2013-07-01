var defer = require('node-promise').defer,
  deferred = defer(),
  mocha = require('mocha'),
  chai = require('chai'),
  assert = chai.assert,
  conf = require('./../../config/convict.js'),
  request = require('supertest'),
  quake = require('quake-sdk'),
  quakeServer = require('./../utility/server.js'),
  fs = require('fs'),
  mockWXR = fs.readFileSync(__dirname + '/../mocks/mockWXR.xml', 'utf8'),
  verbs,
  server,
  app,
  user,
  userToken,
  filename = 'testWXR2.xml',
  filepath;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //Allow https testing with self-signed certs

module.exports = function () {
  suite('Stripe', function() {
    suiteSetup(function(done) {
      quakeServer.startApp(function (aserver, aapp, auser, atoken, aheader, auserToken, auserHeader) {
        server = aserver;
        app = aapp;
        user = auser;
        userToken = auserToken;
        verbs = require('./../utility/verbs.js')(app);
        filepath = user.id + '/wxr/' + filename;
        done();
      })
    });

    suiteTeardown(function(done) {
      quakeServer.cleanUser(user, function () {
        quakeServer.stopApp(server, function () {
          deferred.resolve(done);
        });
      });
    });


    test('POST to /aws/wxr should save a WXR file to the WXR folder.', function (done) {
      verbs.post('/aws/wxr', userToken).send({filename: filename,body: mockWXR}).end(function (err, res) {
        var result = JSON.parse(res.text);
        assert.equal(result.ETag.length, 34, 'Valid ETag should be returned');
        assert.equal(result.RequestId.length, 16, 'Valid RequestId should be returned');
        done();
      });
    });

    test('POST to /file/wxr should parse a WXR', function (done) {
      verbs.post('/file/wxr', userToken).send({filename: filename}).end(function (err, res) {
        console.log('res.text', res.text);
        var result = JSON.parse(res.text);
        console.log('result', result);
        done();
      });
    });

    test('DELETE to /aws/wxr should delete the WXR file from the WXR folder.', function (done) {
      verbs.del('/aws/wxr', userToken).send({filename: filename}).end(function (err, res) {
        var result = JSON.parse(res.text);
        assert.equal(result.RequestId.length, 16, 'Valid RequestId should be returned');
        done();
      });
    });


  });

  return deferred.promise;
};
