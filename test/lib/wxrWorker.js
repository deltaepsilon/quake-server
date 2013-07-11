var defer = require('node-promise').defer,
  deferred = defer(),
  mocha = require('mocha'),
  chai = require('chai'),
  assert = chai.assert,
  fs = require('fs'),
  mockWXR = fs.readFileSync(__dirname + '/../mocks/mockWXR.xml', 'utf8'),
  wxrWorker = require('./../../api/workers/wxrWorker.js');

module.exports = function () {

  var meta,
    posts;
  suite('wxrWorker', function() {
    test('wxrWorker.parse should correctly parse a WXR file', function (done) {
      wxrWorker.parse(mockWXR).then(function (res) {
        meta = res.meta;
        posts = res.posts;

        assert.equal(Object.keys(res.meta).length, 20, 'Mock file contains 20 different metadata sections');
        assert.equal(res.posts.length, 24, 'Mock file contains 24 different items (aka posts)');
        done();
      }, function (err) {
        assert.fail(err, undefined, 'wxWorker.parse should not throw errors.');
        done();
      });
    });

    test('wxxWorker.metaProcess should correctly process metadata', function (done) {
      wxrWorker.metaProcess(meta).then(function (meta) {
          assert.equal(meta.meta.term.length, 37, 'Must extract correct number of terms');
          assert.equal(meta.meta.category.length, 24, 'Must extract correct number of categories');
          assert.equal(meta.meta.author.length, 4, 'Must extract correct number of authors');
          assert.equal(meta.meta.base_site_url, 'http://nothing.com', 'Base site url should match');
          assert.equal(meta.meta.base_blog_url, 'http://nothing.com', 'Base blog url should match');
          assert.equal(meta.meta.description, 'Art, Sewing, Design, Bookbinding, Photography, Crafts', 'Description should match');
          assert.equal(meta.meta.title, 'ISLY | I Still Love You', 'Title should match');

          done();
      },
      function (err) {
        assert.fail(err, undefined, 'wxWorker.metaProcess should not throw errors.');
        done();
      });
    });

    test('wxxWorker.postsProcess should correctly process posts', function (done) {
      wxrWorker.postsProcess(posts).then(function (posts) {
          console.log('posts', posts);

          done();
        },
        function (err) {
          assert.fail(err, undefined, 'wxWorker.postsProcess should not throw errors.');
          done();
        });
    });

  });

  return deferred.promise;
};

