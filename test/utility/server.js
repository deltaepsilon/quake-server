var conf = require('./../../config/convict.js'),
  decisionApp = require('express')(),
  quake = require('quake-sdk'),
  sails = require('sails'),
  userMock = require('./../mocks/userMock.js'),
  server,
  verbs;

module.exports = {
  startApp: function (callback) {
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
          });
        });
      });
    });
  },
  stopApp: function (server, callback) {
    server.close();
    sails.lower();
    callback();
  },
  cleanUser: function (user, callback) {
    verbs.del('/user').send({id: user.id}).end(function () {
      callback();
    });
  }
}
