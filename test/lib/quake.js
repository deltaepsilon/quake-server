var defer = require('node-promise').defer,
  all = require('node-promise').all,
  deferred = defer(),
  mocha = require('mocha'),
  chai = require('chai'),
  assert = chai.assert,
  conf = require('./../../config/convict.js'),
  quakeUtil = require('./../../api/utilities/quake.js');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //Allow https testing with self-signed certs

module.exports = function () {
  suite('Quake Utilities', function() {


    test('ParamNormalizer should add user ids to paths', function (done) {
      var url1 = '/post/findAll?access_token=03a39b4f-eabd-4096-8702-8473686f5761&token_type=bearer',
        url2 = 'post/findAll?access_token=03a39b4f-eabd-4096-8702-8473686f5761&token_type=bearer',
        url3 = 'post/findAll/',
        userID = '123456789';
      assert.equal(quakeUtil.paramNormalizer(url1, userID), '/post/findAll/123456789?access_token=03a39b4f-eabd-4096-8702-8473686f5761&token_type=bearer');
      assert.equal(quakeUtil.paramNormalizer(url2, userID), '/post/findAll/123456789?access_token=03a39b4f-eabd-4096-8702-8473686f5761&token_type=bearer');
      assert.equal(quakeUtil.paramNormalizer(url3, userID), '/post/findAll/123456789');
      done();

    });


    var req = {
        query: {
          test1: 'test1value',
          test2: 'test2value',
          test3: 'test3value'
        }
      },
      res = {
        send: function (res) { },
        error: function (err) { }
      },
      action = function () {
        var deferred = defer();
        deferred.resolve(arguments);
        return deferred.promise;
      },
      requirements = ['test1', 'test2'],
      optional = ['test3'];
    test('generic should throw errors for missing required params', function (done) {
      quakeUtil.generic(req, res, action, ['test1', 'nothere'], optional).then(function (result) {
        assert.fail(result, 'should not succeed');
        done();
      }, function (err) {
        assert.equal(err, 'nothere missing', 'Should throw error');
        done();
      });

    });

    test('generic should include optional params', function (done) {
      quakeUtil.generic(req, res, action, requirements, optional).then(function (result) {
        assert.deepEqual(result, { '0': 'test1value', '1': 'test2value', '2': 'test3value' }, 'Arguments should be passed through');
        done();
      });

    });

  });
  return deferred.promise;

};
