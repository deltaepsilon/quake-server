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
  awsService = require('./../services/awsService.js'),
  Handler = require('./../utilities/quake.js').handler;

var AwsController = {
  wxr: function (req, res) {
    console.log('wxr');
    var handler = new Handler(res),
      query = _.extend(req.query || {}, req.params || {}, req.body || {});

    switch (req.method) {
      case 'GET':
        console.log('get');
        awsService.s3List(req.user.clientID + '/wxr').then(handler.success, handler.error);
        break;
      case 'DELETE':
        awsService.s3Delete(req.user.clientID + '/wxr/' + query.filename).then(handler.success, handler.error);
        break;
      case 'POST':
        awsService.s3Save(req.user.clientID + '/wxr/' + query.filename, query.body).then(handler.success, handler.error);
        break;
      default:
        handler.error('AWS http verb ' + req.method + ' not supported.');
        break;
    }

  }


};
module.exports = AwsController;