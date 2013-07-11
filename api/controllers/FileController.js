/*---------------------
	:: File 
	-> controller
---------------------*/
var defer = require('node-promise').defer,
  _ = require('underscore'),
  Handler = require('./../utilities/quake.js').handler,
  defaultError = function (req, res, name) {
    res.error('Http verb: ' + req.method + ' not supported by ' + name);
  },
  fileService = require('./../services/fileService.js'),
  Query = require('./../utilities/quake.js').query,
  getArgs = function (required, params) {
    var i = required.length,
      args = [],
      param;
    while (i--) {
      param = params[required[i]];
      if (!param) {
        return required[i]+ ' missing';
      } else {
        args.unshift(param);
      }
    }
    return args;

  },
  generic = function (req, res, action, requirements, progress) {
    var handler = new Handler(res),
      query = new Query(req),
      args = getArgs(requirements, query.augment());

    if (Array.isArray(args)) {
      action.apply({}, args).then(handler.success, handler.error, progress);
    } else {
      handler.error(args);
    }

  };

var FileController = {
  store: function (req, res) {
    generic(req, res, fileService.store, ['userID', 'payload', 'filename', 'mimetype', 'classification']);

  },
  create: function (req, res) {
    generic(req, res, fileService.create, ['userID', 'classification', 'paths']);

  },
  stat: function (req, res) {
    generic(req, res, fileService.stat, ['userID', 'paths']);

  },
  remove: function (req, res) {
    generic(req, res, fileService.remove, ['userID', 'paths']);

  },
  wxr: function (req, res) {
    var progress = function (message) { // Broadcast progress events via websockets
      res.publish('wxr', '/wxr', message);
    };
    generic(req, res, fileService.wxr, ['userID', 'id'], progress);

  }

};
module.exports = FileController;