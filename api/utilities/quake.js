var _ = require('underscore');

module.exports = {
  resolver: function (deferred) {
    return {
      done: function (err, res) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(res);
        }
      },
      resolve: function (res) {
        deferred.resolve(res);
      },
      reject: function (err) {
        deferred.reject(err);
      }
    } ;
  },
  handler: function (res) {
    var success = function (response) {
        res.send(JSON.stringify(response));
      },
      error = function (err) {
        res.error(err.message || err);
      };
    return {
      success: success,
      error: error
    }
  },
  query: function (req) {
    return {
      augment: function () {
        return _.extend(req.query || {}, req.params || {}, req.body || {});
      }
    }
  },
  paramNormalizer: function (url, id) {
    var params = url.split('/');
    if (params[0] === '') {
      params.shift();
    }
    if (params[params.length - 1] === '') {
      params.pop();
    }
    if (params.length < 3) {
      params.push(id);
    }
    return '/' + params.join('/');
  }

}
