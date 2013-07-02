var defer = require('node-promise').defer,
  deferred = defer(),
  mocha = require('mocha'),
  chai = require('chai'),
  assert = chai.assert,
  fs = require('fs'),
  mockWXR = fs.readFileSync(__dirname + '/../mocks/mockWXR.xml', 'utf8'),
  wxrWorker = require('./../../api/workers/wxrWorker.js');

module.exports = function () {

  suite('wxrWorker', function() {
    test('wxrWorker directParse functions should correctly parse a WXR file', function (done) {
      wxrWorker.parse(mockWXR, function (err, res) {
        assert.equal(Object.keys(res.meta[0]).length, 20, 'Mock file contains 20 different metadata sections');
        assert.equal(res.items.length, 24, 'Mock file contains 24 different items (aka posts)');
        done();
      });
    });

  });

  return deferred.promise;
};

