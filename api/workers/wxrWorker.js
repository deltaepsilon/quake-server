var _ = require('underscore'),
  FeedParser = require('feedparser'),
  stream = require('stream'),
  options = {
    normalize: false
  },
  parse = function (buffer, callback) {
    var readable = new stream.Readable(),
      feedParser = new FeedParser(options),
      errors = [],
      meta = [],
      items = [],
      noop = function () {};

    feedParser.on('error', function (err) {
      errors.push(err);
    }).on('readable', function () {
      items.push(feedParser.read());
    }).on('meta', function (result) {
      meta.push(result);
    }).on('end', function () {
      var error = errors.length ? {errors: errors} : null;
      callback(error, {
        meta: meta,
        items: items
      });
    });

    feedParser._transform(buffer, 'utf8', noop);
    feedParser._flush(noop);
  };

process.on('message', function (message) {
  parse(message.buffer, function (err, res) {
    process.send({err: err, res: res});
  });
});

module.exports = {
  parse: parse
}


