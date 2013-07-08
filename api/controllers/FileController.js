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
  generic = function (req, res, action, requirements) {
    var handler = new Handler(res),
      query = new Query(req),
      args = getArgs(requirements, query.augment());

    if (Array.isArray(args)) {
      action.apply({}, args).then(handler.success, handler.error);
    } else {
      handler.error(args);
    }

  };

var FileController = {
  wxr: function (req, res) {
    var handler = new Handler(res),
      query = new Query(req);

    switch (req.method) {
      case 'GET':
        fileService.wxrGet(req.user.clientID, query.filename).then(handler.success, handler.error);
        break;
      case 'DELETE':
        fileService.wxrDestroy(req.user.clientID, query.filename).then(handler.success, handler.error);
        break;
      case 'POST':
        fileService.wxrParse(req.user.clientID, query.filename).then(handler.success, handler.error);
        break;
      default:
        defaultError(req, res, 'wxr');
        break;
    }

  },
  wxrList: function (req, res) {
    var handler = new Handler(res);

    switch (req.method) {
      case 'GET':
        fileService.wxrList(req.user.clientID).then(handler.success, handler.error);
        break;
      case 'DELETE':
        fileService.wxrDestroyAll(req.user.clientID).then(handler.success, handler.error);
        break;
      default:
        defaultError(req, res, 'wxrList');
        break;
    }

  },
  create: function (req, res) {
    generic(req, res, fileService.create, ['userID', 'classification', 'paths']);

  },
  store: function (req, res) {
    generic(req, res, fileService.store, ['userID', 'payload', 'filename', 'mimetype', 'classification']);

  },
  stat: function (req, res) {
    generic(req, res, fileService.stat, ['userID', 'paths']);

  },
  remove: function (req, res) {
    generic(req, res, fileService.remove, ['userID', 'paths']);

  }

};
module.exports = FileController;