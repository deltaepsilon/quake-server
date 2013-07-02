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
  awsService = require('./../services/awsService.js'),
  wxrWorker = require('./../workers/wxrWorker.js'),
  fork = require('child_process').fork;

var FileController = {
  wxr: function (req, res) {
    var localCallback = callback(res),
      query = _.extend(req.query || {}, req.params || {}, req.body || {});

    console.log('calling awsService.s3Get');

    awsService.s3Get(req.user.clientID + '/wxr/' + query.filename, function (err, result) {
      var buffer = awsService.streamEncode(result.Body, 'utf8'),
      workerProcess = fork(__dirname + './../workers/wxrWorker.js');
      workerProcess.send({buffer: buffer, stream: result.Body});

      workerProcess.on('message', function (message) {

        console.log('parent received message', message);
        workerProcess.kill();
        localCallback(null, message);

      });
    });
  }


};
module.exports = FileController;