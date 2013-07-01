var _ = require('underscore'),
  conf = require('./../../config/convict.js'),
  bucketName = conf.get('amazon_assets_bucket'),
  AWS = require('aws-sdk'),
  s3Bucket = new AWS.S3({params: {Bucket: bucketName}});

module.exports = {
  s3Get: function (path, encoding, callback) {
    s3Bucket.getObject({
      Bucket: bucketName,
      Key: path
    }, callback);
  },
  s3Save: function (path, body, callback) {
    s3Bucket.putObject({
      Bucket: bucketName,
      Body: body,
      Key: path
    }, callback);
  },
  s3List: function (path, callback) {
    s3Bucket.listObjects({
      Bucket: bucketName,
      Prefix: path
    }, callback);
  },
  s3Delete: function (path, callback) {
    s3Bucket.deleteObject({
      Bucket: bucketName,
      Key: path
    }, callback);
  },
  streamEncode: function (stream, encoding, callback) {
    buffer = new Buffer(stream, encoding || 'utf8');
    return buffer.toString();
  }
}
