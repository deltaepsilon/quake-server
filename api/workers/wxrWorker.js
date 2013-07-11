var _ = require('underscore'),
  defer = require('node-promise').defer,
  all = require('node-promise').all,
  FeedParser = require('feedparser'),
  stream = require('stream'),
  options = {
    normalize: false
  },
  parsePercent = .1,
  metaPercent = .1,
  numerator = 0,
  denominator,
  getPercent = function () {
    if (!denominator) {
      return 0;
    }
    return numerator/denominator;
  },
  errorHandler = function (err) {
    var message = {err: err};
    if (process.send) {
      process.send(message);
    } else {
      console.log(message);
    }
  },
  broadcastStatus = function (percent, status) {
    var message = {res: {percent: Math.round(percent * 10000) / 100, status: status}};
    if (process.send) {
      process.send(message);
    } else {
      console.log(message);
    }
  };


var wxrWorker = {
  /*
   * Parse the incoming buffer using FeedParser
   * Access FeedParser's internal methods to kick off the process
   * Subscribe to FeedParser's events to collect data and return results
   */
  parse: function (buffer) {
    var deferred = defer(),
      readable = new stream.Readable(),
      feedParser = new FeedParser(options),
      errors = [],
      meta = [],
      posts = [],
      noop = function () {};

    feedParser.on('error', function (err) {
      errors.push(err);
    }).on('readable', function () {
        posts.push(feedParser.read());
      }).on('meta', function (result) {
        meta.push(result);
      }).on('end', function () {
        var error = errors.length ? {errors: errors} : null;


        if (error) {
          deferred.reject(error);
        } else {
          denominator = (1 + parsePercent + metaPercent) * posts.length; // Allocate arbitrary percentages to parsing and metadata
          numerator += parsePercent/denominator;
          broadcastStatus(getPercent(), 'parse');

          deferred.resolve({
            status: 'parse',
            meta: meta[0],
            posts: posts
          });
        }
      });

    feedParser._transform(buffer, 'utf8', noop);
    feedParser._flush(noop);
    return deferred.promise;

  },

  /*
   * Process FeedParser metadata results
   * They're kinda ugly
   */
  metaProcess: function (meta) {
    var deferred = defer(),
      getValue = function (key) { // Pluck the value from keys. Be resourceful in finding a value that can be returned.
        if (!meta[key]) {
          return key
        } else if (!meta[key]['#']) {
          return meta[key];
        } else {
          return meta[key]['#'];
        }

      },
      clean = function (items) { // Clean individual items by removing in wp: prefixes and ignoring some keys
        var keys = Object.keys(items),
          i = keys.length,
          key,
          item,
          value,
          result = {};
        while (i--) {
          key = keys[i];
          if (_.contains(['@', 'wp:term_id', 'wp:author_id'], key)) {
            continue;
          } else {
            item = items[key];
            value = items[key]['#']
            if (value) {
              result[key.replace(/wp:/, '')] = value;
            }
          }
        }
        return result;

      },
      extract = function (key, canonical) { // Step through arrays of items and send them off to be cleaned
        var values = meta[key],
          i = values.length,
          result = [],
          cleaned;

        while(i--) {
          cleaned = clean(values[i]);
          cleaned.canonical = cleaned[canonical].toLowerCase();
          result.unshift(cleaned);
        }
        return result;

      },
      result = {
        title: getValue('rss:title'),
        description: getValue('rss:description'),
        base_blog_url: getValue('wp:base_blog_url'),
        base_site_url: getValue('wp:base_site_url'),
        author: extract('wp:author', 'author_login'),
        category: extract('wp:category', 'category_nicename'),
        term: extract('wp:term', 'term_slug')
      };



//    //Read out keys for testing purposes
//    var keys = Object.keys(result),
//      i = keys.length;
//
//    console.log('keys', keys);
//    while (i--) {
//      console.log('\n\n' + keys[i] + ': ', result[keys[i]]);
//    }


    numerator += metaPercent/denominator;
    broadcastStatus(getPercent(), 'meta');
    deferred.resolve({
      status: 'meta',
      meta: result
    });
    return deferred.promise;

  },

  /*
   * Process FeedParser posts
   */
  postsProcess: function (posts) {
    var deferred = defer(),
      i = posts.length,
      post,
      result = [];

    while (i--) {
      post = posts[i];
      result.unshift(post);
      numerator += 1;
      broadcastStatus(getPercent(), 'posts');
    }

    deferred.resolve({
      status: 'posts',
      percent: getPercent(),
      posts: result
    });
    return deferred.promise;
  }
};


/*
 * Receive message from parent process with buffer to process
 * Step through parsing, metadata extraction and posts extraction
 * Message results back to parent process to provide percent complete
*/
process.on('message', function (message) {
  var meta,
    posts;
  wxrWorker.parse(message.buffer)
    .then(function (res) {
      process.send({res: res});
      meta = res.meta;
      posts = res.posts;
      return wxrWorker.metaProcess(meta);

    }, errorHandler)
    .then(function (res) {
      process.send({res: res});
      return wxrWorker.postsProcess(posts);

    }, errorHandler)
    .then(function (res) {
      process.send({res: res});

    }, errorHandler);

});

module.exports = wxrWorker;


