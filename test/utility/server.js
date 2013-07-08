var defer = require('node-promise').defer,
  conf = require('./../../config/convict.js'),
  decisionApp = require('express')(),
  quake = require('quake-sdk'),
  sails = require('sails'),
  userMock = require('./../mocks/userMock.js'),
  server,
  verbs;

module.exports = {
  startApp: function (callback) {
    var deferred = defer();
    decisionApp.use(quake.middleware.decision);
    server = decisionApp.listen(conf.get('quiver_port'));

    sails.lift({
      port: conf.get('quake_port')
    }, function() {
      var app = sails.sails.express.app;
      verbs = require('./verbs.js')(app);
      quake.auth.getToken('quiver', null, null, function (token, header) {
        global.quakeSDKHeader = header;
        global.quakeSDKToken = token;
        verbs.post('/user/findOrCreate').send(userMock).end(function (err, res) {
          var user = JSON.parse(res.text);
          quake.auth.getToken(user.id, user.clientID, user.clientSecret, function (userToken, userHeader) {
            callback(server, app, user, token, header, userToken, userHeader);
            deferred.resolve([server, app, user, token, header, userToken, userHeader]);
          });
        });
      });
    });
    return deferred.promise;

  },
  stopApp: function (server, callback) {
    var deferred = defer();
    server.close();
    sails.lower();
    callback();
    deferred.resolve();
    return deferred.promise;
  },
  refreshUser: function () {
    var deferred = defer();
    quake.auth.getToken('quiver', null, null, function (token, header) {
      global.quakeSDKHeader = header;
      global.quakeSDKToken = token;
      deferred.resolve();
    });
    return deferred.promise;
  },
  cleanUser: function (user, callback) {
    var deferred = defer();
    verbs.del('/user').send({id: user.id}).end(function (err, res) {
      callback();
      deferred.resolve();
    });
    return deferred.promise;

  }
}
