var conf = require('./../../config/convict.js'),
  stripe = require('stripe')(conf.get('stripe_sk'));

module.exports = {
  createSubscription: function (plan, customer, description, coupon, callback) {

    var payload = {
      card: customer.id || customer.card,
      plan: plan,
      description: description
    };

    if (coupon) {
      payload.coupon = coupon;
    }

    stripe.customers.create(payload, function (err, customer) {
      callback(err, customer);
    });

  },

  /*
   *  TODO Edit subscription should take plan changes and card changes.
   *  Test both
  */



  updateSubscription: function (token, plan, proposedCustomer, customer, coupon, callback) {
    var payload = {
      plan: plan
    };

    if (coupon) {
      payload.coupon = coupon;
    }

    if (token) {
      payload.card = token;
    } else if (proposedCustomer && customer && proposedCustomer.card.last4 !== customer.active_card.last4) {
      payload.card = proposedCustomer.card;
    }

    stripe.customers.update_subscription(customer.id, payload, function (err, subscription) {
      if (err) {
        callback(err);
      } else {
        stripe.customers.retrieve(customer.id, function (err, freshCustomer) {
          callback(err, freshCustomer);
        })
      }

    });
  },

  updateCard: function (token, proposedCustomer, customer, callback) {
    var updates = {
      card: token || proposedCustomer.card
    };

    stripe.customers.update(customer.id, updates, function (err, customer) {
      callback(err, customer);
    });
  }
}
