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
  fileService = require('./../../api/services/fileService.js'),
  mockWXR = fs.readFileSync(__dirname + '/../mocks/mockWXR.xml', 'utf8'),
  verbs,
  server,
  app,
  user,
  userToken,
  filename = 'testWXR1.xml',
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

    test('fileService.download should retrieve and save files.', function (done) {
      var mockUpload = { source: {
          original: 'http://images.melissaesplin.com/wp-content/uploads/2007/12/nativity_full_01_web.jpg',
          extension: 'zip',
          type: 'binary',
          mimetype: 'application/binary'
        },
          attributes: {}
        },
        mockUploadUrl = 'http://' + conf.get('amazon_assets_bucket') + '/' + user.id + mockUpload.source.original.replace(/http(s)?:\/\/[^\/]+/, '');

      fileService.download(user.id, mockUpload).then(function (file) {
        assert.deepEqual(file.source, mockUpload.source, 'File should match the mock');
        assert.equal(file.url, mockUploadUrl, 'The url best match');

        fileService.destroyById(file.id).then(function (result) {
          assert.equal(result, 1, 'One downloaded file removed from DB');
          done();
        });

      });
    });


    var inkBlob1;
    test('POST to /file/store should save a WXR file to the WXR folder.', function (done) {
      verbs.post('/file/store', userToken).send({filename: filename, payload: new Buffer(mockWXR, 'utf8').toString('base64'), mimetype: 'text/xml', classification: 'wxr'}).end(function (err, res) {
        var result = JSON.parse(res.text),
          inkBlob = result[0];
        inkBlob1 = inkBlob;
        assert.equal(inkBlob.filename, filename, 'Valid File object should be returned');
        done();
      });
    });

    test('POST to /file/wxr should import an existing WXR file', function (done) {
      var socket = verbs.io(userToken);

      socket.on('connect', function () {
        socket.emit('message', JSON.stringify({url: '/file/wxr', data: {id: inkBlob1.id, 'access_token': userToken, 'token_type': 'bearer'}}));

      });

      socket.on('wxr', function (message) {
        if (message.complete) {
          verbs.post('/post/findAll', userToken).end(function (err, res) {
            var posts = JSON.parse(res.text);
            assert.equal(posts.length, 11, 'Should import correct number of posts.');
            done();
          });

        } else {
          console.log('wxr: ', message);
        }

      });

      socket.on('error', function (message) {
        console.warn('receiving error: ', message);
      });

    });

    test('GET to /aws/s3Object should return nothing, because the parse function cleaned out the WXR folder.', function (done) {
      verbs.get('/aws/s3Object?key=/wxr/' + filename, userToken).end(function (err, res) {
        assert.equal(JSON.parse(res.text).error, 'The specified key does not exist.', 'File should be missing.');
        done();
      });
    });

    //TODO Delete posts, meta and file object. Make sure files are off of s3.
    test('Should be able to remove all existing files by userID', function (done) {
      verbs.del('/file/destroy', userToken).end(function (err, res) {
        assert.equal(res.text, 31, 'Should remove files.');
        done();
      });

    });

    test('Should be able to remove all existing posts by userID', function (done) {
      verbs.del('/post/destroyWhere', userToken).end(function (err, res) {
        assert.equal(res.text, 11, 'Posts removed');
        done();
      });

    });

    test('Should be able to remove Meta', function (done) {
      verbs.del('/meta/destroyWhere', userToken).end(function (err, res) {
        assert.equal(res.text, 1, 'Meta removed');
        done();
      });

    });


  });

  return deferred.promise;
};
