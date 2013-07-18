var _ = require('underscore'),
  Mongo = require('mongodb'),
  ObjectID = Mongo.ObjectID,
  defer = require('node-promise').defer;

var util = {
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
        var err = err || 'error';
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
  addUserID: function (userID, models) {
    var models = Array.isArray(models) ? models : [models],
      i = models.length;

    if (typeof userID === 'string') {
      userID = new ObjectID(userID);
    }

    while (i--) {
      models[i].userID = userID;
    }
    return models;

  },
  paramNormalizer: function (url, id) {
    var query = url.split('?'),
      params = query[0].split('/'),
      queryClean = query[1] ? '?' + query[1] : '';
    if (params[0] === '') {
      params.shift();
    }
    if (params[params.length - 1] === '') {
      params.pop();
    }
    if (params.length < 3 && id) {
      params.push(id);
    }
    return '/' + params.join('/') + queryClean;

  },
  getMongoID: function (id) {
    if (typeof id === 'object' && id.id) {
      return id;
    }
    return new ObjectID(id);

  },
  getArgs: function (required, params, optional) {
    var i = required.length,
      args = [],
      param;
    while (i--) {
      param = params[required[i]];
      if (!param && !optional) {
        return required[i]+ ' missing';
      } else {
        args.unshift(param);
      }
    }
    return args;

  },
  generic: function (req, res, action, requirements, optional, progress) {
    var deferred = defer(),
      handler = new util.handler(res),
      query = new util.query(req),
      optional = optional ? util.getArgs(optional, query.augment(), true) : [],
      args = util.getArgs(requirements, query.augment());

    if (Array.isArray(args)) {
      args = args.concat(optional);
      action.apply({}, args).then(function (result) {
        handler.success(result);
        deferred.resolve(result);
      }, function (err) {
        handler.error(err);
        deferred.resolve(err);
      }, progress);
    } else {
      handler.error(args);
      deferred.reject(args);
    }
    return deferred.promise;

  }

};

module.exports = util;