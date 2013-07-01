/*---------------------
	:: Files 
	-> controller
---------------------*/
var _ = require('underscore'),
  callback = function (res) {
    return function (err, response) {
      if (err) {
        return res.error(err.message || err);
      }
      res.send(JSON.stringify(response));
    }
  },
  awsService = require('./../services/awsService.js');

var AwsController = {
  wxr: function (req, res) {
    var localCallback = callback(res),
      query = _.extend(req.query || {}, req.params || {}, req.body || {});

    switch (req.method) {
      case 'GET':
        awsService.s3List(req.user.clientID + '/wxr', localCallback);
        break;
      case 'DELETE':
        awsService.s3Delete(req.user.clientID + '/wxr/' + query.filename, localCallback);
        break;
      case 'POST':
        awsService.s3Save(req.user.clientID + '/wxr/' + query.filename, query.body, localCallback);
        break;
      default:
        localCallback('AWS http verb ' + req.method + ' not supported.');
        break;
    }

  }


};
module.exports = AwsController;