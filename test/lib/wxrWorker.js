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
          assert.equal(meta.meta.base_site_url, 'http://melissaesplin.com', 'Base site url should match');
          assert.equal(meta.meta.base_blog_url, 'http://melissaesplin.com', 'Base blog url should match');
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
      wxrWorker.postsProcess('fakeuserid', posts).then(function (res) {
          var posts = res.posts,
            first = posts[0];

          assert.equal(first.link, 'http://melissaesplin.com/2007/10/hello-world/', 'Link');
          assert.equal(first.date.getTime(), 1193631993000, 'Pubdate');
          assert.equal(first.category.canonical, 'adventure', 'Category');
          assert.equal(first.meta[0].canonical, '_edit_last', 'Meta');

          assert.equal(posts.length, 11, 'Should return 11 posts.');
          assert.equal(res.percent, 100, 'Should be 100% done.');
          assert.equal(res.status, 'complete', 'Should be complete.');

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

