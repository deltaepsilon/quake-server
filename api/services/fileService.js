var awsService = require('./awsService.js'),
  wxrWorker = require('./../workers/wxrWorker.js'),
  fork = require('child_process').fork;

var fileService = {
  wxrParse: function (userID, filename, callback) {
    if (!userID) {
      callback('wxrParse failed: User ID missing');
    }
    if (!filename) {
      callback('wxrParse failed: Filename missing');
    }

    awsService.s3Get(userID + '/wxr/' + filename, function (err, result) {
      var buffer = awsService.streamEncode(result.Body, 'utf8'),
        workerProcess = fork(__dirname + './../workers/wxrWorker.js');
      workerProcess.send({buffer: buffer});

      workerProcess.on('message', function (message) {
        workerProcess.kill();
        if (message.err) {
          callback(message.err)
        } else {
          fileService.wxrSave(userID, filename, message.res, callback);
        }
      });

    });

  },
  wxrSave: function (userID, filename, wxr, callback) {
    if (!userID) {
      callback('wxrSave failed: User ID missing.');
    }
    if (!filename) {
      callback('wxrSave failed: Filename missing');
    }
    if (!wxr) {
      callback('wxrSave failed: WXR contents missing');
    }
    WXR.create({userID: userID, filename: filename, meta: wxr.meta, items: wxr.items}, callback);

  },
  wxrGet: function (userID, filename, callback) {
    if (!userID) {
      callback('wxrGet failed: User ID missing.');
    }
    if (!filename) {
      callback('wxrGet failed: Filename missing');
    }
    WXR.find({userID: userID, filename: filename}, callback);

  },
  wxrList: function (userID, callback) {
    if (!userID) {
      callback('wxrList failed: User ID missing.');
    }
    WXR.find({userID: userID}, callback);

  },
  wxrDelete: function (userID, filename, callback) {
    if (!userID) {
      callback('wxrDelete failed: User ID missing.');
    }
    if (!filename) {
      callback('wxrDelete failed: Filename missing');
    }
    WXR.delete({userID: userID, filename: filename}, callback);

  },
  wxrDeleteAll: function (userID, callback) {
    if (!userID) {
      callback('wxrDeleteAll failed: User ID missing.');
    }
    WXR.delete({userID: userID}, callback);

  }
};

module.exports = fileService;
