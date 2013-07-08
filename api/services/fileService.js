var awsService = require('./awsService.js'),
  filepicker = require('node-filepicker')(),
  defer = require('node-promise').defer,
  all = require('node-promise').all,
  wxrWorker = require('./../workers/wxrWorker.js'),
  fork = require('child_process').fork,
  Resolver = require('./../utilities/quake.js').resolver,
  normalizePaths = function (paths) {
    return paths.split(',');
  };

var fileService = {
  wxrParse: function (userID, filename) {
    var deferred = defer(),
      resolver = new Resolver(deferred);
    if (!userID) {
      resolver.reject('wxrParse failed: User ID missing');
    } else if (!filename) {
      resolver.reject('wxrParse failed: Filename missing');
    } else {
      awsService.s3Get(userID + '/wxr/' + filename).then(function (result) {
        var buffer = awsService.streamEncode(result.Body, 'utf8'),
          workerProcess = fork(__dirname + './../workers/wxrWorker.js');
        workerProcess.send({buffer: buffer});

        workerProcess.on('message', function (message) {
          workerProcess.kill();
          if (message.err) {
            resolver.reject(message.err);
          } else {
            fileService.wxrSave(userID, filename, message.res).then(resolver.resolve);
          }
        });

      });
    }
    return deferred.promise;

  },
  wxrSave: function (userID, filename, wxr) {
    var deferred = defer(),
      resolver = new Resolver(deferred);
    if (!userID) {
      resolver.reject('wxrSave failed: User ID missing.');
    } else if (!filename) {
      resolver.reject('wxrSave failed: Filename missing');
    } else if (!wxr) {
      resolver.reject('wxrSave failed: WXR contents missing');
    } else {
      WXR.destroyWhere({userID: userID, filename: filename}, function (err) {
        if (err) {
          resolver.reject(err);
        } else {
          WXR.create({userID: userID, filename: filename, meta: wxr.meta, items: wxr.items}, resolver.done);
        }
      });
    }
    return deferred.promise;

  },
  wxrGet: function (userID, filename) {
    var deferred = defer(),
      resolver = new Resolver(deferred);
    if (!userID) {
      resolver.reject('wxrGet failed: User ID missing.');
    } else if (!filename) {
      resolver.reject('wxrGet failed: Filename missing');
    } else {
      WXR.find({userID: userID, filename: filename}, resolver.done);
    }


    return deferred.promise;

  },
  wxrList: function (userID) {
    var deferred = defer(),
      resolver = new Resolver(deferred);
    if (!userID) {
      resolver.reject('wxrList failed: User ID missing.');
    } else {
      WXR.findAll({userID: userID}, resolver.done);
    }

    return deferred.promise;

  },
  wxrDestroy: function (userID, filename) {
    var deferred = defer(),
      resolver = new Resolver(deferred);
    if (!userID) {
      resolver.reject('wxrDelete failed: User ID missing.');
    } else if (!filename) {
      resolver.reject('wxrDelete failed: Filename missing');
    } else {
      WXR.destroy({userID: userID, filename: filename}, resolver.done);
    }
    return deferred.promise;

  },
  wxrDestroyAll: function (userID) {
    var deferred = defer(),
      resolver = new Resolver(deferred);
    if (!userID) {
      resolver.reject('All failed: User ID missing.');
    } else {
      WXR.destroy({userID: userID}, resolver.done);
    }
    return deferred.promise;

  },
  wxrAdd: function (userID, paths) {
    var deferred = defer(),
      resolver = new Resolver(deferred);
    if (!userID) {
      resolver.reject('wxrDelete failed: User ID missing.');
    } else if (!paths) {
      resolver.reject('wxrDelete failed: Paths missing.');
    } else {
      fileService.fileAdd(userID, paths, 'wxr').then(function (result) {
        console.log('fileService just got the results');
      }, resolver.reject);
    }
    return deferred.promise;
  },
  fileAdd: function (userID, paths, fileType) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      promises = [],
      pathsArray = paths.split(','),
      i = pathsArray.length;

    return User.findById(userID).then(function (user) {
      if (!user.files) { // Populate empty files attributes
        user.files = {}
      }
      if (!user.files[fileType]) {
        user.files[fileType] = [];
      }

      while (i--) {
        promises.push(filepicker.stat({url: pathsArray[i]}));
//          user.files[fileType].push(pathsArray);
      }
      return all(promises).then(function (results) {
        console.log('results', results);
        deferred.resolve(result);
      });

    }, resolver.reject);
    return deferred.promise;

  },
  store: function (userID, payload, filename, mimetype, classification) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      path = userID + '/';

    if (classification) {
      path += classification + '/';
    }

    filepicker.store(payload, filename, mimetype, {path: path}).then(function (res) {
      var inkBlob = JSON.parse(res);
      fileService.create(userID, classification, inkBlob.url).then(resolver.resolve, resolver.reject);
    });
    return deferred.promise;

  },
  create: function (userID, classification, paths) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      paths = normalizePaths(paths),
      i = paths.length,
      promises = [],
      promise;

    while (i--) {
      promise = filepicker.stat({url: paths[i]}).then(function (res) {
        var deferred = defer(),
          resolver = new Resolver(deferred),
          inkBlob = JSON.parse(res);
        inkBlob.userID = userID;
        inkBlob.classification = classification;
        File.create(inkBlob, resolver.done);
        return deferred.promise;
      });
      promises.push(promise);
    }

    all(promises).then(resolver.resolve, resolver.reject);
    return deferred.promise;

  },
  stat: function (userID, paths) {
    var paths = normalizePaths(paths);
  },
  remove: function (userID, paths) {
    var paths = normalizePaths(paths);
  }
};

module.exports = fileService;
