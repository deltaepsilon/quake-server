var conf = require('./../../config/convict.js'),
  defer = require('node-promise').defer,
  all = require('node-promise').all,
  quakeUtil = require('./../utilities/quake.js'),
  Resolver = quakeUtil.resolver

var modelService = {
  destroy: function (entity, userID, where) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      where = where || {userID: quakeUtil.getMongoID(userID)},
      Model = sails.models[entity];

    Model.destroyWhere(where, resolver.done);
    return deferred.promise;

  }
};

module.exports = modelService;



