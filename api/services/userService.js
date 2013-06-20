var _ = require('underscore');

module.exports = {
  scrubUser: function (user) {
    return _.omit(user, ['clientID', 'clientSecret', 'values', '_json', '_raw', 'action', 'controller', 'entity', 'save', 'destroy']);
  }
}
