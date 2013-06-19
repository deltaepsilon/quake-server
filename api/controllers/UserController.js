/*---------------------
	:: User 
	-> controller
---------------------*/
var _ = require('underscore'),
  uuid = require('node-uuid'),
  scrubUser = function (user) {
    return _.omit(user, ['clientID', 'clientSecret', 'values', '_json', '_raw', 'action', 'controller', 'entity', 'save', 'destroy']);
  },
  UserController = {
    findOrCreate: function (req, res, next) {
      var qUser = req.body;

      // Augment the user a bit just in case he/she gets saved. Won't affect existing users.
      qUser.providerID = qUser.id;
      qUser.clientID = uuid.v4();
      qUser.clientSecret = uuid.v4();

      User.findOrCreate({providerID: qUser.providerID}, qUser, function (err, user) {
        res.setHeader('Content-Type', 'text/json');
        if (err) {
          res.end(JSON.stringify('err'));
        } else {
          res.end(JSON.stringify(user));
        }
      });
    },

    update: function (req, res) {
      var id = req.param('id');
      if(!id) return res.send('No id specified!');

      // Create monolithic parameter object
      var params = _.extend(req.query || {}, req.params || {}, req.body || {});

      // Ignore id in params
      delete params['id'];


      // Otherwise find and update the model in question
      User.update(id, params, function(err, model) {
        if(err) return res.send(err, 500);
        if(!model) return res.send('Model cannot be found.', 404);

        User.publishUpdate(id, model);
        if (req.user.clientID === 'quiver') {
          return res.json(model);
        } else {
          return res.json(scrubUser(model));
        }

      });
    }
  };
module.exports = UserController;