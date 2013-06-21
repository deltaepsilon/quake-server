var conf = require('./../../config/convict.js'),
  stripe = require('stripe')(conf.get('stripe_sk'));

module.exports = {
  createSubscription: function (req, res, callback) {

    User.findById(req.user.clientID, function (err, user) {
      if (!req.body || !req.body.stripe) {
        return res.error('Stripe token is missing');
      }
      if (!req.body.plan) {
        return res.error('Subscription plan is missing');
      }
      if (!(req.body.stripe.customer.id || req.body.stripe.customer.card)) {
        return res.error('Stripe customer is missing');
      }

      var payload = {
        card: req.body.stripe.customer.id || req.body.stripe.customer.card,
        plan: req.body.plan,
        description: user.displayName + ', ' + user.emails[0].value
      };

      if (req.body.coupon) {
        payload.coupon = req.body.coupon;
      }

      stripe.customers.create(payload, function (err, customer) {
        if (err) {
          return res.error(err.message);
        } else {
          req.body = {stripe: customer};
          callback(req, res);
        }
      });
    });

  }
}
