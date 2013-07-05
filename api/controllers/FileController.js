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

  }


};
module.exports = FileController;