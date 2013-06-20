/*---------------------
	:: Subscription 
	-> controller
---------------------*/
var _ = require('underscore'),
  userService = require('./../services/userService.js'),
  SubscriptionController = {
  create: function (req, res) {
    // Create monolithic parameter object
    var id = req.user.clientID,
      params = _.extend(req.query || {}, req.params || {}, req.body || {});

    // Ignore id in params
    delete params['id'];

    console.log(params, req.user);

    // Otherwise find and update the model in question
    User.update(id, {subscription: {
      planID: params.planID,
      customer: params.customer
    }}, function(err, model) {
      if(err) return res.send(err, 500);
      if(!model) return res.send('Model cannot be found.', 404);

      User.publishUpdate(id, model);
      if (req.user.clientID === 'quiver') {
        return res.json(model);
      } else {
        return res.json(userService.scrubUser(model));
      }

    });
  }


};
module.exports = SubscriptionController;