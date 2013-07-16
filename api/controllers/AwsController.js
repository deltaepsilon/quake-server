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
  Handler = require('./../utilities/quake.js').handler,
  Query = require('./../utilities/quake.js').query;

var AwsController = {
  s3Object: function (req, res) {
    var handler = new Handler(res),
      query = new Query(req).augment();

    switch (req.method) {
      case 'GET':
        awsService.s3Get(req.user.clientID + query.key).then(handler.success, handler.error);
        break;
      case 'DELETE':
        awsService.s3Delete(req.user.clientID + query.key).then(handler.success, handler.error);
        break;
      case 'POST':
        awsService.s3Save(req.user.clientID + query.key, query.body).then(handler.success, handler.error);
        break;
      default:
        handler.error('AWS http verb ' + req.method + ' not supported.');
        break;
    }

  },
  s3List: function (req, res) {
    var handler = new Handler(res),
      query = new Query(req).augment(),
      key = req.user.clientID.toString();

    if (query.key) {
      key += query.key;
    }
    awsService.s3List(key).then(handler.success, handler.error);
  }


};
module.exports = AwsController;