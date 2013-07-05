var _ = require('underscore'),
  conf = require('./../../config/convict.js'),
  bucketName = conf.get('amazon_assets_bucket'),
  AWS = require('aws-sdk'),
  s3Bucket = new AWS.S3({params: {Bucket: bucketName}}),
  defer = require('node-promise').defer,
  Resolver = require('./../utilities/quake.js').resolver;

module.exports = {
  s3Get: function (path) {
    var deferred = defer(),
      resolver = new Resolver(deferred);
    s3Bucket.getObject({
      Bucket: bucketName,
      Key: path
    }, resolver.done);
    return deferred.promise;
  },
  s3Save: function (path, body) {
    var deferred = defer(),
      resolver = new Resolver(deferred);

    s3Bucket.putObject({
      Bucket: bucketName,
      Body: body,
      Key: path
    }, resolver.done);
    return deferred.promise;
  },
  s3List: function (path) {
    var deferred = defer(),
      resolver = new Resolver(deferred);
    s3Bucket.listObjects({
      Bucket: bucketName,
      Prefix: path
    }, resolver.done);
    return deferred.promise;
  },
  s3Delete: function (path) {
    var deferred = defer(),
      resolver = new Resolver(deferred);
    s3Bucket.deleteObject({
      Bucket: bucketName,
      Key: path
    }, resolver.done);
    return deferred.promise;
  },
  streamEncode: function (stream, encoding) {
    //Requires node >=v0.10.12. The old buffer class couldn't handle everything
    buffer = new Buffer(stream, encoding || 'utf8');
    return buffer.toString();
  }
}
