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
  awsService = require('./../../api/services/awsService.js'),
  verbs,
  server,
  app,
  user,
  userToken,
  filename = 'testWXR.xml',
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

    test('GET to /aws/wxr should return a list of the wrx folder.', function (done) {
      verbs.get('/aws/wxr', userToken).end(function (err, res) {
        var response = JSON.parse(res.text),
          contents = response.Contents,
          i = contents.length,
          record;
        assert.isTrue(Array.isArray(contents), 'Contents should be array');

        while (i--) {
          if (contents[i].Key === filepath) {
            record = contents[i];
            break;
          }
        }

        assert.equal(record.Key, filepath, 'POSTed file should be present in list.');
        done();
      });
    });

    var wxrResult;
    test('awsService be able to get the WXR object', function (done) {
      awsService.s3Get(filepath, function (err, result) {
        var buffer = new Buffer(result.Body, 'utf8');
        wxrResult = result;
        assert.equal(result.ETag.length, 34, 'ETag should be correct length');
        assert.equal(result.ContentLength, buffer.length.toString(), 'ContentLength should match uploaded file');
        done();
      });
    });

    test('awsService streamEncode should return a utf8-encoded buffer', function (done) {
      var buffer = awsService.streamEncode(wxrResult.Body, 'utf8'),
        wxrResultLength = parseInt(wxrResult.Body.length, 10),
        bufferLength = buffer.length;
        assert.isTrue(Math.abs(wxrResultLength - bufferLength)/bufferLength < .0009, 'ContentLength should match uploaded file');
        done();
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