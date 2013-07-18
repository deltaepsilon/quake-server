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

        File.destroyWhere({url: path}, function (err, result) {
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
  destroyById: function (id) {
    var deferred = defer(),
      resolver = new Resolver(deferred);

    File.findById(id, function (err, file) {
      awsService.s3Delete(file.path).then(function () {
        File.destroyWhere({id: id}, resolver.done);
      }, resolver.reject);
    });
    return deferred.promise;

  },
  save: function (userID, key, body, file, params) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      key = userID.toString() + key,
      file = _.extend(file, {
        url: 'http://' + conf.get('amazon_assets_bucket') + '/' + key,
        userID: userID,
        path: key,
        mimetype: params.ContentType || file.mimetype
      }),
      params = params || {};
    awsService.s3Save(key, body, params).then(function () {
      File.create(file, function (err, newFile) {
        if (err) {
          resolver.reject(err);
        } else {
          resolver.resolve(newFile);
        }
      });
    }, deferred.reject);
    return deferred.promise;

  },
  destroy: function (userID, where) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      where = where || {userID: quakeUtil.getMongoID(userID)};

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

  },
  wxr: function (userID, id) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      userID = quakeUtil.getMongoID(userID);

    File.findById(id, function (err, file) {
      if (err) { return resolver.reject(err);}

      awsService.s3Get(file.path).then(function (result) {
        var buffer = awsService.streamEncode(result.Body, 'utf8'),
          workerProcess = fork(__dirname + './../workers/wxrWorker.js'),
          metaDeferred = defer(),
          metaResolver = new Resolver(metaDeferred),
          postsDeferred = defer(),
          postsResolver= new Resolver(postsDeferred),
          wxrDeferred = defer(),
          wxrResolver= new Resolver(wxrDeferred),
          imported = {},
          importPromise = function (afile) { // Search for file. If it's there, return it... otherwise, download it, save it, and resolve
            var adeferred = defer();

            File.find({original: afile.source.original}, function (err, bfile) {
              if (bfile) {
                adeferred.resolve(bfile);
              } else {
                fileService.download(userID, afile).then(adeferred.resolve, adeferred.reject);
              }
            });
            return adeferred.promise;

          };


        /*
         * Filter messages based on their keys
         * Meta: message.res.meta
         * Complete: message.res.status === 'complete'
         * File download: message.res.source
         * Progress: default
        */
        workerProcess.on('message', function (message) {
          if (message.err) {
            workerProcess.kill();
            resolver.reject(message.err);

          } else if (message.res.meta) {
            Meta.create(quakeUtil.addUserID(userID, message.res.meta), metaResolver.done);

          } else if (message.res.status === 'complete') { // Complete
            Post.create(quakeUtil.addUserID(userID, message.res.posts), postsResolver.done);
            fileService.remove(userID, file.url).then(wxrResolver.resolve, wxrResolver.reject);
            workerProcess.kill();

          } else if (message.res.source) { // Download file

            if (!imported[message.res.source.original]) { // Create a promise if it's missing
              imported[message.res.source.original] = {
                promise: importPromise(message.res)
              };
            }
            imported[message.res.source.original].promise.then(function (result) {
              workerProcess.send(result);
            });

          } else { // Emit progress events
            deferred.progress({percent: message.res.percent, status: message.res.status});

          }
        });

        // Start parsing process
        workerProcess.send({buffer: buffer});

        // Clean up
        all([metaDeferred.promise, postsDeferred.promise, wxrDeferred.promise]).then(function (res) {
          workerProcess.removeAllListeners();
          deferred.resolve(res);
        });

      });

    });
    return deferred.promise;

  },
  download: function (userID, file) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      original = file.source.original,
      userID = quakeUtil.getMongoID(userID);

    // Http request for file
    request.get(file.source.original)
      .set('X-NO-STREAM', true)
      .set('connection', 'keep-alive')
      .set('Accept-Encoding', 'gzip,deflate,sdch')
      .set('Accept', 'text/javascript, text/html, application/xml, text/xml, */*')
      .parse(function (res) {
        res.text = '';
        res.setEncoding('binary');
        res.on('data', function (data) {
          res.text += data;
        });
        res.on('end', function () { // Save this sucker... yes, we're in callback hell. Sorry y'all
          var key = original.replace(ROOT_REGEX, ''),
            params = {ACL: 'public-read', ContentType: file.source.mimetype},
            body = new Buffer(res.text, 'binary');

          file.url = 'http://' + conf.get('amazon_assets_bucket') + '/' + key;
          file.userID = userID;
          file.classification = file.source.type;
          file.path = key;

          fileService.save(userID, key, body, file, params)
            .then(resolver.resolve, resolver.reject);

        });
      })
      .end(function (err, res) {
        //Don't do jack... the callback is handled in the parse
      });
    return deferred.promise;

  }

};

module.exports = fileService;
