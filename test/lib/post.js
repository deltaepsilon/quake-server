var defer = require('node-promise').defer,
  all = require('node-promise').all,
  deferred = defer(),
  mocha = require('mocha'),
  chai = require('chai'),
  assert = chai.assert,
  quakeServer = require('./../utility/server.js'),
  quakeUtil = require('./../../api/utilities/quake.js'),
  Resolver = quakeUtil.resolver,
  fs = require('fs'),
  mockPost = require('./../mocks/post.js'),
  verbs,
  server,
  app,
  user,
  userToken;

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


    test('POST to /post/create should create a post.', function (done) {
      verbs.post('/post/create', userToken).send(mockPost).end(function (err, res) {
        var post = JSON.parse(res.text);
        assert.equal(post.title, mockPost.title, 'Title');
        done();
      });

    });

    test('/post/destroyWhere should destroy matching posts', function (done) {
      var mockPost1 = _.extend(mockPost, {title: 'mockPost1'}),
        mockPost2 = _.extend(mockPost, {title: 'mockPost2'}),
        mockPost3 = _.extend(mockPost, {title: 'mockPost3'}),
        deferred1 = defer(),
        deferred2 = defer(),
        deferred3 = defer(),
        deferred4 = defer(),
        deferred5 = defer(),
        resolver1 = new Resolver(deferred1),
        resolver2 = new Resolver(deferred2),
        resolver3 = new Resolver(deferred3),
        resolver4 = new Resolver(deferred4),
        resolver5 = new Resolver(deferred5),
        promisesCreate = [deferred1.promise, deferred2.promise, deferred3.promise],
        promisesDestroy;

      verbs.post('/post/create', userToken).send(mockPost1).end(resolver1.done);
      verbs.post('/post/create', userToken).send(mockPost2).end(resolver2.done);
      verbs.post('/post/create', userToken).send(mockPost3).end(resolver3.done);

      all(promisesCreate).then(function () {
        verbs.del('/post/destroyWhere', userToken).send({where: {title: mockPost1.title}}).end(resolver4.done);
        verbs.del('/post/destroyWhere', userToken).end(resolver5.done);
      });

      all(promisesDestroy).then(function (destroyed) {
        console.log('destroyed', destroyed);
//        assert.equal(res.text, 1, 'Deleted just one post');
      });


    });

  });
  return deferred.promise;

};

