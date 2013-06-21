var conf = require('./../../config/convict.js'),
  stripe = require('stripe')(conf.get('stripe_sk'));

console.log('******', conf.get('stripe_sk'));

module.exports = {
  createSubscription: function (req, res, callback) {

    User.findById(req.user.clientID, function (err, user) {
      stripe.customers.create({
        card: req.body.customer.id || req.body.customer.card,
        plan: req.body.plan,
        description: user.displayName + ', ' + user.emails[0].value
      }, function (err, customer) {
        if (err) {
          console.log('Stripe error: ', err);
          res.send(500, err);
        } else {
          req.body = {stripe: customer};
          callback(req, res);
        }
      });
    });

  }
}
