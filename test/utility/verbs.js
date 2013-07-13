var request = require('supertest'),
  io = require('socket.io-client'),
  conf = require('./../../config/convict.js');

module.exports = function (app) {
  return {
    post: function (path, token) {
      return request(app).post(path).set('authorization', token ? 'Bearer ' + token : global.quakeSDKHeader);
    },
    put: function (path, token) {
      return request(app).put(path).set('authorization', token ? 'Bearer ' + token : global.quakeSDKHeader);
    },
    del: function (path, token) {
      return request(app).del(path).set('authorization', token ? 'Bearer ' + token : global.quakeSDKHeader);
    },
    get: function (path, token) {
      return request(app).get(path).query({access_token: token || global.quakeSDKToken}).query({token_type: 'bearer'});
    },
    io: function (token) {
      return io.connect(conf.get('quake_external') + '?token_type=bearer&access_token=' + token);
    }
  };
};