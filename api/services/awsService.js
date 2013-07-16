var _ = require('underscore'),
  conf = require('./../../config/convict.js'),
  bucketName = conf.get('amazon_assets_bucket'),
  AWS = require('aws-sdk'),
  s3Bucket = new AWS.S3({params: {Bucket: bucketName}}),
  defer = require('node-promise').defer,
  Resolver = require('./../utilities/quake.js').resolver;

module.exports = {
  s3Get: function (key, params) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      defaultParams = {
        Bucket: bucketName,
        Key: key
      };
    s3Bucket.getObject(_.extend(defaultParams, params), resolver.done);
    return deferred.promise;

  },
  s3Save: function (key, body, params) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      defaultParams = {
        Bucket: bucketName,
        Body: body,
        Key: key
      };
    s3Bucket.putObject(_.extend(defaultParams, params), resolver.done);
    return deferred.promise;

  },
  s3List: function (key, params) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      defaultParams = {
        Bucket: bucketName,
        Prefix: key
      };
    s3Bucket.listObjects(_.extend(defaultParams, params), resolver.done);
    return deferred.promise;

  },
  s3Delete: function (key, params) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      defaultParams = {
        Bucket: bucketName,
        Key: key
      };
    s3Bucket.deleteObject(_.extend(defaultParams, params), resolver.done);
    return deferred.promise;

  },
  streamEncode: function (stream, encoding) {
    //Requires node >=v0.10.12. The old buffer class couldn't handle everything
    buffer = new Buffer(stream, encoding || 'utf8');
    return buffer.toString();

  }
}
