var conf = require('./../../config/convict.js'),
  awsService = require('./awsService.js'),
  filepicker = require('node-filepicker')(),
  defer = require('node-promise').defer,
  all = require('node-promise').all,
  request = require('superagent'),
  wxrWorker = require('./../workers/wxrWorker.js'),
  fork = require('child_process').fork,
  quakeUtil = require('./../utilities/quake.js'),
  Resolver = quakeUtil.resolver,
  normalizePaths = function (paths) {
    return paths.split(',');
  },
  ROOT_REGEX = /http(s)?:\/\/[^\/]+/;

var postService = {
  destroy: function (userID, where) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      where = where || {userID: quakeUtil.getMongoID(userID)};

    console.log('\nDestroy where: ', where);

    File.findAll(where, function (err, files) {
      var i = files ? files.length : 0,
        promises = [];

      if (err) { return resolver.reject(err); }

      while (i--) {
        promises.push(awsService.s3Delete(files[i].path));
      }
      all(promises).then(function () {
        File.destroyWhere(where, resolver.done);
      }, resolver.reject);

    });
    return deferred.promise;

  }
};

module.exports = postService;

