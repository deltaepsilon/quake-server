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
  fileService = require('./../services/fileService.js');

var FileController = {
  wxr: function (req, res) {
    var handler = new Handler(res),
      query = _.extend(req.query || {}, req.params || {}, req.body || {});

    switch (req.method) {
      case 'GET':
        return fileService.wxrGet(req.user.clientID, query.filename).then(handler.success, handler.error);
        break;
      case 'DELETE':
        return fileService.wxrDestroy(req.user.clientID, query.filename).then(handler.success, handler.error);
        break;
      case 'POST':
        return fileService.wxrParse(req.user.clientID, query.filename).then(handler.success, handler.error);
        break;
      default:
        return defaultError(req, res, 'wxr');
        break;
    }

  },
  wxrList: function (req, res) {
    var handler = new Handler(res);

    switch (req.method) {
      case 'GET':
        return fileService.wxrList(req.user.clientID).then(handler.success, handler.error);
        break;
      case 'DELETE':
        return fileService.wxrDestroyAll(req.user.clientID).then(handler.success, handler.error);
        break;
      default:
        return defaultError(req, res, 'wxrList');
        break;
    }

  },
  wxrFiles: function (req, res) {
    var handler = new Handler(res),
      query = _.extend(req.query || {}, req.params || {}, req.body || {});
    switch (req.method) {
      case 'POST':
        return fileService.wxrAdd(req.user.clientID, query.paths).then(handler.success, handler.error);
        break;
      default:
        return defaultError(req, res, 'wxrAdd');
        break;
    }
  }


};
module.exports = FileController;