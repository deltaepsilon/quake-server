var defer = require('node-promise').defer,
  all = require('node-promise').all,
  deferred = defer(),
  mocha = require('mocha'),
  chai = require('chai'),
  assert = chai.assert,
  conf = require('./../../config/convict.js'),
  request = require('supertest'),
  quake = require('quake-sdk'),
  quakeServer = require('./../utility/server.js'),
  filepicker = require('node-filepicker')(),
  fs = require('fs'),
  mockWXR = fs.readFileSync(__dirname + '/../mocks/mockWXR.xml', 'utf8'),
  imageStream = fs.readFileSync(__dirname + '/../mocks/30.jpeg'),
  imageBuffer = new Buffer(imageStream, 'binary'),
  image = imageBuffer.toString('base64'),
  verbs,
  server,
  app,
  user,
  userToken,
  filename = 'testWXR.xml',
  filepath;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //Allow https testing with self-signed certs

module.exports = function () {
  suite('File', function() {
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


    test('POST to /file/store should store a file through Filepicker and return the accompanying File object.', function (done) {
      verbs.post('/file/store', userToken).send({payload: mockWXR, filename: filename, mimetype: 'text/xml', classification: 'wxr'}).end(function (err, res) {
        var result = JSON.parse(res.text),
          file = result[0],
          regex = new RegExp(user.id + "\/wxr\/[0-9a-zA-Z]+_testWXR.xml");

        assert.equal(result.length, 1, 'One and only one file should be returned');
        assert.equal(file.path.match(regex).index, 0, 'User id and classification should be part of filepath');
        verbs.post('/file/remove', userToken).send({paths: file.url}).end(function (err, res) {
          assert.equal(JSON.parse(res.text)[0], 'success', 'WXR file removed');
          done();
        });

      });
    });

    var imageBlobs,
      imagePaths;
    test('POST to /file/create should take a paths argument and run findOrCreate on the quake File object, returning the results.', function (done) {
      var promises = [],
        path1 = user.id + '/images/image1.jpeg',
        path2 = user.id + '/images/image2.jpeg';

      promises.push(filepicker.store(image, 'image1', 'image/jpeg', {path: user.id + '/images/image1.jpeg'}));
      promises.push(filepicker.store(image, 'image2', 'image/jpeg', {path: user.id + '/images/image2.jpeg'}));
      all(promises).then(function (results) {
        var inkBlob1 = JSON.parse(results[0]),
          inkBlob2 = JSON.parse(results[1]),
          paths = [inkBlob1.url, inkBlob2.url].join(',');
        imagePaths = paths;

        assert.equal(results.length, 2, 'Created 2 new files');

        verbs.post('/file/create', userToken).send({paths: paths, classification: 'image'}).end(function (err, res) {
          var result = JSON.parse(res.text);
          imageBlobs = result;

          assert.equal(result.length, 2, 'Two new File objects were created');
          assert.equal(result[0].classification, 'image', 'Classification should be image');
          assert.equal(result[1].classification, 'image', 'Classification should be image');
          done();
        });

      });


    });

    test('POST to /file/stat with paths argument should return two inkBlobs', function (done) {
      verbs.post('/file/stat', userToken).send({paths: imagePaths}).end(function (err, res) {
        var metadata = JSON.parse(res.text);

        assert.equal(metadata[0].mimetype, 'image/jpeg', 'Mimetype matches');
        assert.equal(metadata[1].mimetype, 'image/jpeg', 'Mimetype matches');
        assert.equal(metadata[0].size, 533, 'Size matches');
        assert.equal(metadata[1].size, 533, 'Size matches');
        done();
      });

    });

    test('POST to /file/remove with paths argument should return two success messages', function (done) {
      verbs.post('/file/remove', userToken).send({paths: imagePaths}).end(function (err, res) {
        var results = JSON.parse(res.text);

        assert.equal(results[0], 'success', 'First image removed');
        assert.equal(results[1], 'success', 'Second image removed');
        assert.deepEqual(results[2], [0, 0], 'File objects removed from server');
        done();
      });

    });

  });
  return deferred.promise;

};
