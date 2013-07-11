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
  store: function (userID, payload, filename, mimetype, classification) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      path = userID + '/';

    if (classification) {
      path += classification + '/';
    }

    // Payload had better be Base64 encoded, or you're getting a pile of poop on the other end.
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
      path,
      promises = [],
      promise;

    while (i--) {
      path = paths[i];
      promise = filepicker.stat({url: path}).then(function (res) {
        var deferred = defer(),
          resolver = new Resolver(deferred),
          inkBlob = JSON.parse(res);
        inkBlob.userID = userID;
        inkBlob.classification = classification;
        inkBlob.url = path;
        File.findOrCreate({url: inkBlob.url}, inkBlob, resolver.done);
        return deferred.promise;
      });
      promises.push(promise);
    }

    all(promises).then(resolver.resolve, resolver.reject);
    return deferred.promise;

  },
  stat: function (userID, paths) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      paths = normalizePaths(paths),
      promises = [],
      i = paths.length;

    while (i--) {
      promises.push(filepicker.stat({url: paths[i]}));
    }

    all(promises).then(function (results) {
      var j = results.length,
        inkBlobs = [];

      while (j--) {
        inkBlobs.push(JSON.parse(results[j]));
      }
      resolver.resolve(inkBlobs);

    }, resolver.reject);

    return deferred.promise;

  },
  remove: function (userID, paths) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      paths = normalizePaths(paths),
      promises = [],
      i = paths.length;

    while (i--) {
      promises.push(filepicker.remove({url: paths[i]})); // Remove files via Filepicker
    }

    promises.push(fileService.destroyByPaths(userID, paths)); // Destroy File objects from server

    all(promises).then(resolver.resolve, resolver.reject);

    return deferred.promise;

  },
  destroyByPaths: function (userID, paths) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      destroy = function (path) {
        var destroyDeferred = defer();
        File.destroyWhere({path: path}, function (err, result) {
          if (err) { return destroyDeferred.reject(err);}
          destroyDeferred.resolve(result);
        });

        return destroyDeferred.promise;
      },
      paths = (typeof paths === 'string') ? normalizePaths(paths) : paths,
      i = paths.length,
      promises = [];

    while (i--) {
      promises.push(destroy(paths[i])); // Destroy each File object by path
    }
    all(promises).then(resolver.resolve, resolver.reject);

    return deferred.promise;

  },
  wxr: function (userID, id) {
    var deferred = defer(),
      resolver = new Resolver(deferred);

    File.findById(id, function (err, file) {
      if (err) { return resolver.reject(err);}

      awsService.s3Get(file.path).then(function (result) {
        var buffer = awsService.streamEncode(result.Body, 'utf8'),
          workerProcess = fork(__dirname + './../workers/wxrWorker.js');
        workerProcess.send({buffer: buffer});

        workerProcess.on('message', function (message) {
          if (message.err) {
            resolver.reject(message.err);
            workerProcess.kill();
          } else if (message.res.step === 'complete') {
            // TODO Handle POST save
            console.log('You still need to save the post results');
            console.log('message.res', message.res);
            workerProcess.kill();

          } else { // Emit progress events
            deferred.progress({percent: message.res.percent, status: message.res.status});

          }
        });
      });

    });
    return deferred.promise;

  }

};

module.exports = fileService;
