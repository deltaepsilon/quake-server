/*---------------------
	:: File 
	-> controller
---------------------*/
var defer = require('node-promise').defer,
  _ = require('underscore'),
  fileService = require('./../services/fileService.js'),
  quakeUtil = require('./../utilities/quake.js'),
  Query = quakeUtil.query,
  generic = quakeUtil.generic;

var FileController = {
  store: function (req, res) { // Filepicker
    generic(req, res, fileService.store, ['userID', 'payload', 'filename', 'mimetype', 'classification']);

  },
  create: function (req, res) { // Filepicker
    generic(req, res, fileService.create, ['userID', 'classification', 'paths']);

  },
  stat: function (req, res) { // Filepicker
    generic(req, res, fileService.stat, ['userID', 'paths']);

  },
  remove: function (req, res) { // Filepicker
    generic(req, res, fileService.remove, ['userID', 'paths']);

  },
  save: function (req, res) { // Save to s3 only... no Filepicker
    generic(req, res, fileService.save, ['userID', 'key', 'body', 'file'], ['params']);

  },
  destroy: function (req, res) { // Destroy on s3
    generic(req, res, fileService.destroy, ['userID'], ['where']);

  },
  wxr: function (req, res) {
    var progress = function (message) { // Broadcast progress events via websockets
      req.socket.emit('wxr', message);
    };
    generic(req, res, fileService.wxr, ['userID', 'id'], [], progress).then(function (wxrFiles) {
      req.socket.emit('wxr', {complete: true, wxr: wxrFiles, message: "Import Complete"});
    });

  }

};
module.exports = FileController;