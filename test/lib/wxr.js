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
  filename = 'testWXR1.xml',
  filename2 = 'testWXR2.xml',
  filepath;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //Allow https testing with self-signed certs

module.exports = function () {
  suite('WXR', function() {
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
      verbs.post('/aws/wxr', userToken).send({filename: filename, body: mockWXR}).end(function (err, res) {
        var result = JSON.parse(res.text);
        assert.equal(result.ETag.length, 34, 'Valid ETag should be returned');
        assert.equal(result.RequestId.length, 16, 'Valid RequestId should be returned');
        done();
      });
    });

    test('POST to /file/wxr should parse a WXR and return a saved object', function (done) {
      verbs.post('/file/wxr', userToken).send({filename: filename}).end(function (err, res) {
        var wxr = JSON.parse(res.text);
        assert.equal(Object.keys(wxr.meta[0]).length, 20, 'Meta should have the right length');
        assert.equal(wxr.items.length, 24, 'Items should have the right length');
        done();
      });
    });


    test('GET to /file/wxr should return the relevant wxr object', function (done) {
      verbs.get('/file/wxr?filename=' + filename, userToken).end(function (err, res) {
        var wxr = JSON.parse(res.text);
        assert.equal(Object.keys(wxr.meta[0]).length, 20, 'Meta should have the right length');
        assert.equal(wxr.items.length, 24, 'Items should have the right length');
        done();
      });
    });

    test('GET to /file/wxrList should return the relevant wxr objects', function (done) {
      // Upload second file
      verbs.post('/aws/wxr', userToken).send({filename: filename2, body: mockWXR}).end(function (err, res) {
        //Parse second file
        verbs.post('/file/wxr', userToken).send({filename: filename2}).end(function (err, res) {
          verbs.get('/file/wxrList', userToken).end(function (err, res) {
            var WXRs = JSON.parse(res.text);
            assert.equal(WXRs.length, 2, 'Should return two WXR files');
            done();
          });
        });
      });

    });

    test('DELETE to /file/wxr should delete one wxr', function (done) {
      verbs.del('/file/wxr', userToken).send({filename: filename}).end(function (err, res) {
        assert.equal(res.text, 1, 'Delete returns a 1');
        done();
      });

    });

    test('DELETE to /file/wxrList should delete all WXR files', function (done) {
      verbs.del('/file/wxrList', userToken).end(function (err, res) {
        assert.equal(res.text, 1, 'Delete returns a 1');
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
