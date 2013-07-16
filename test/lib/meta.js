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
  mockMeta = require('./../mocks/meta.js'),
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
        mockMeta.userID = user.id;
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


    test('POST to /meta/create should create a Meta object.', function (done) {
      verbs.post('/meta/create', userToken).send(mockMeta).end(function (err, res) {
        var meta = JSON.parse(res.text);
        assert.equal(meta.title, mockMeta.title, 'Title');
        done();
      });

    });

    test('/meta/destroyWhere should destroy matching Metas', function (done) {
      var mockMeta1 = _.extend(_.clone(mockMeta), {title: 'mockMeta1'}),
        mockMeta2 = _.extend(_.clone(mockMeta), {title: 'mockMeta2'}),
        mockMeta3 = _.extend(_.clone(mockMeta), {title: 'mockMeta3'}),
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
        promisesDestroy = [deferred4.promise, deferred5.promise];

      verbs.post('/meta/create', userToken).send(mockMeta1).end(resolver1.done);
      verbs.post('/meta/create', userToken).send(mockMeta2).end(resolver2.done);
      verbs.post('/meta/create', userToken).send(mockMeta3).end(resolver3.done);

      all(promisesCreate).then(function () {
        verbs.del('/meta/destroyWhere', userToken).send({where: {title: mockMeta1.title}}).end(resolver4.done);
        deferred4.promise.then(function (res) {
          assert.equal(res.text, 1, 'Deleted one');
          verbs.del('/meta/destroyWhere', userToken).end(resolver5.done);
        });

      });



      all(promisesDestroy).then(function (res) {
        var i = res.length,
          results = [];
        while (i--) {
          results.push(res[i].text);
        }
        assert.deepEqual(results, ['3', '1'], 'Should delete in order');
        done();
      });

    });

  });
  return deferred.promise;

};


