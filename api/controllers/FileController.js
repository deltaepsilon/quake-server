/*---------------------
	:: File 
	-> controller
---------------------*/
var defer = require('node-promise').defer,
  _ = require('underscore'),
  callback = function (res) {
    return function (err, response) {
      if (err) {
        return res.error(err.message || err);
      }
      res.send(JSON.stringify(response));
    }
  },
  fileService = require('./../services/fileService.js');

var FileController = {
  wxr: function (req, res) {
    var localCallback = callback(res),
      query = _.extend(req.query || {}, req.params || {}, req.body || {});

    switch (req.method) {
      case 'GET':
        fileService.wxrGet(req.user.clientID, query.filename, localCallback);
        break;
      case 'DELETE':
        fileService.wxrDestroy(req.user.clientID, query.filename, localCallback);
        break;
      case 'POST':
        fileService.wxrParse(req.user.clientID, query.filename, localCallback);
        break;
    }

  },

  wxrList: function (req, res) {
    var localCallback = callback(res);

    switch (req.method) {
      case 'GET':
        fileService.wxrList(req.user.clientID, localCallback);
        break;
      case 'DELETE':
        fileService.wxrDestroyAll(req.user.clientID, localCallback);
        break;
    }
  }


};
module.exports = FileController;