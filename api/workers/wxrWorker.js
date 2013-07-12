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
  postsLength,
  numerator = 0,
  denominator,
  getPercent = function () {
    if (!denominator) {
      return 0;
    }
    return Math.round(numerator/denominator * 100);
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
    var message = {res: {percent: percent, status: status}};
    if (process.send) {
      process.send(message);
    } else {
      console.log(message);
    }
  },
  getValue = function (source, key, canonical) { // Pluck the value from keys. Be resourceful in finding a value that can be returned.
//    console.log('source[key] key:', source[key]);
    var result;
    if (!source[key] || !source[key]['#']) { // Return undefined if the key doesn't have a value
      return;
    } else if (source[key]['@'] && Object.keys(source[key]['@']).length) { // Attempt to extend the value with its metadata
      if (typeof source[key]['#'] === 'object') {
        result = _.extend(source[key]['@'], source[key]['#']);
      } else {
        result = source[key]['@'];
        result.value = source[key]['#'];
      }
    } else { // Simply capture the value
      result = source[key]['#'];
    }

    if (canonical && result[canonical]) {
      result.canonical = result[canonical];
    }

    return result;

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
  extract = function (source, key, canonical) { // Step through arrays of items and send them off to be cleaned
    var values = source[key],
      i = values ? values.length : 0,
      result = [],
      cleaned;

    while(i--) {
      cleaned = clean(values[i]);
      cleaned.canonical = canonical ? cleaned[canonical].toLowerCase() : null;
      result.unshift(cleaned);
    }
    return result;

  },

  /*
   * Builds tag object with best guesses as to file types
   *
   * Skips tags that don't have a forward slash and some extension... we wouldn't want to capture TLDs
   * Skips tags that have .html, .htm or no file extension. These are likely non-asset uris
   * Indicates whether a tag is img, video, audio or binary (Anything unrecognized is binary)
   */
  buildTag = function (tag) {
    var imageExt = ['jpg', 'jpeg', 'gif', 'png', 'tiff'],
      videoExt = ['mp4', 'webm', 'ogg', 'ogv'],
      audioExt = ['mp3', 'ogg', 'opus', 'webm', 'aac', 'aiff', 'wav'],
      extensions = imageExt.concat(videoExt, audioExt),
      ATTR_REGEXG = /(\w+?)="(.+?)"/ig,
      ATTR_REGEX = /(\w+?)="((.+?)\/\w+?\.(\w+?))"/i,
      KEY_REGEX = /(\w+?)="(.+?)"/i,
      attributes = tag.match(ATTR_REGEXG),
      i = attributes.length,
      attribute,
      cleanAttributes = {source: null, attributes: {}},
      type;

    while (i--) {
      attribute = attributes[i].match(ATTR_REGEX)

      if (attribute && attribute[1] && _.contains(['href', 'src'], attribute[1]) && !_.contains(['html', 'htm'], attribute[4])) {
        // Video and audio tags do overlap... this tends to categorize them as video
        if (_.contains(imageExt, attribute[4])) {
          type = 'image';
        } else if (_.contains(['a', 'video'], attribute[1]) && _.contains(videoExt, attribute[4])) {
          type = 'video';
        } else if (_.contains(['a', 'audio'], attribute[1]) && _.contains(audioExt, attribute[4])) {
          type = 'audio';
        } else {
          type = 'binary';
        }
        cleanAttributes.source = {
          original: attribute[2],
          extension: attribute[4],
          type: type
        };

      } else { // Attempt to collect extra attributes
        attribute = attributes[i].match(KEY_REGEX); // Reassign attribute to the more permissive REGEX
        if (attribute) {
          cleanAttributes.attributes[attribute[1]] = attribute[2];
        }

      }
    }
    return cleanAttributes;

  },
  importFiles = function (files, post) {
    var deferred = defer(),
      promises = [];

    /*
     * TODO Analyze images to determine which need to be slurped
     * TODO Asks fileService to slurp files
     * TODO Listens using a process.on() listener for a specifically-coded message
     * TODO On receipt of coded message, listener resolves the deferred with {post: post, files: newFiles}
     * TODO Listener tears itself down with process.removeListener('message', callback);
    */
    all(promises).then(function () { // Wait until all of the file objects have returned from
      /*
       * TODO Runs a global regex-replace through post.content and post.excerpt for URIs that match new files
       * TODO Resolves initial promise with the updated post
       */

      deferred.resolve(post);
    });
    return deferred.promise;

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
          postsLength = posts.length;
          denominator = (1 + parsePercent + metaPercent) * postsLength; // Allocate arbitrary percentages to parsing and metadata
          numerator += parsePercent * postsLength;
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
      result = {
        title: getValue(meta, 'rss:title'),
        description: getValue(meta, 'rss:description'),
        base_blog_url: getValue(meta, 'wp:base_blog_url'),
        base_site_url: getValue(meta, 'wp:base_site_url'),
        author: extract(meta, 'wp:author', 'author_login'),
        category: extract(meta, 'wp:category', 'category_nicename'),
        term: extract(meta, 'wp:term', 'term_slug')
      };

//    //Read out keys for testing purposes
//    var keys = Object.keys(posts),
//      i = keys.length;
//
//    console.log('keys', keys);
//    while (i--) {
//      console.log('\n\n' + keys[i] + ': ', result[keys[i]]);
//    }

    numerator += metaPercent * postsLength;
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
  postsProcess: function (userID, posts) {
    var deferred = defer(),
      incrementPercent = function () {
        numerator += 1;
        broadcastStatus(getPercent(), 'posts');
      },
      i = posts.length,
      post,
      postObject,
      result = [],
      promises = [],
      promise;

    while (i--) {
      post = posts[i];

//      console.log('post', Object.keys(post));
//      console.log('category', post['rss:category']);
      postObject = {
        title: getValue(post, 'rss:title'),
        link: getValue(post, 'rss:link'),
        date: new Date(getValue(post, 'rss:pubdate')),
        creator: getValue(post, 'dc:creator').toLowerCase(),
        description: getValue(post, 'rss:description'),
        content: getValue(post, 'content:encoded'),
        excerpt: getValue(post, 'excerpt:encoded'),
//        post_date: new Date(getValue(post, 'wp:post_date')),
        post_name: getValue(post, 'wp:post_name'),
        status: getValue(post, 'wp:status'),
//        post_parent: getValue(post, 'wp:post_parent'),
//        menu_order: getValue(post, 'wp:menu_order'),
        post_type: getValue(post, 'wp:post_type'),
        category: getValue(post, 'rss:category', 'nicename'),
        meta: extract(post, 'wp:postmeta', 'meta_key'),
        comment: extract(post, 'wp:comment')
      };


      if (postObject.post_type !== 'attachment') { // Don't include lame attachment posts. They don't really help.
        promise = wxrWorker.imageProcess(userID, postObject);
        promise.then(function (postClean) {
          incrementPercent();
          result.unshift(postClean);
        });
        promises.push(promise);

      } else {
        incrementPercent();
      }

    }

    all(promises).then(function () { // Wait until all of the posts are image-processed
      deferred.resolve({
        status: 'complete',
        percent: getPercent(),
        posts: result
      });
    });


    return deferred.promise;
  },

  /*
   * Image
  */
  imageProcess: function (userID, post) {
    var deferred = defer(),
      text = post.content + post.excerpt,
      tags = text.match(/<(video|img|a|audio).*?>/gi) || [],
      i = tags.length,
      files = [],
      tag;

    while (i--) {
      tag = buildTag(tags[i]);
      if (tag.source) {
        files.push(tag);
      }

    }
    importFiles(files, post).then(deferred.resolve);
    return deferred.promise;

  }
};


/*
 * Receive message from parent process with buffer to process
 * Step through parsing, metadata extraction and posts extraction
 * Message results back to parent process to provide percent complete
*/
process.once('message', function (message) {
  var meta,
    posts,
    userID = message.userID;
  wxrWorker.parse(message.buffer)
    .then(function (res) {
      process.send({res: res});
      meta = res.meta;
      posts = res.posts;
      return wxrWorker.metaProcess(meta);

    }, errorHandler)
    .then(function (res) {
      process.send({res: res});
      return wxrWorker.postsProcess(userID, posts);

    }, errorHandler)
    .then(function (res) {
      process.send({res: res});

    }, errorHandler);

});

module.exports = wxrWorker;


