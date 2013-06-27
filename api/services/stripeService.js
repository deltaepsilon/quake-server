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

    stripe.customers.create(payload, callback);

  },

  /*
   *  TODO Edit subscription should take plan changes and card changes.
   *  Test both
  */



  updateSubscription: function (token, plan, proposedCustomer, customer, coupon, callback) {
    var payload = {};

    if (plan) {
      payload.plan = plan;
    }

    if (coupon) {
      payload.coupon = coupon;
    }

    if (token) {
      payload.card = token;
    } else if (proposedCustomer && proposedCustomer.card && customer && proposedCustomer.card.last4 !== customer.active_card.last4) {
      payload.card = proposedCustomer.card;
    }

    stripe.customers.update_subscription(customer.id, payload, function (err, subscription) {
      if (err) {
        callback(err);
      } else {
        stripe.customers.retrieve(customer.id, callback);
      }

    });
  },

  updateCard: function (token, proposedCustomer, customer, callback) {
    var updates = {
      card: token || proposedCustomer.card
    };

    stripe.customers.update(customer.id, updates, callback);
  },

  getCustomer: function (id, callback) {
    stripe.customers.retrieve(id, callback);
  },

  deleteCustomer: function (id, callback) {
    stripe.customers.del(id, callback);
  },

  updateCustomer: function (id, updates, callback) {
    stripe.customers.update(id, updates, callback);
  },

  listCustomers: function (count, offset, callback) {
    stripe.customers.list(count || 10, offset || 0, callback);
  },

  deleteCustomers: function (customerIDs, callback) {
    if (!conf.get('env') === 'development') {
      return callback('You cannot delete all customers outside of a development environment.');
    }
    if (!customerIDs) {
      return callback('customerIDs missing from delete params');
    }
    console.log('deleting customers', customerIDs);

    var deleteCustomers = function (ids, cb) {
      stripe.customers.del(ids.pop(), function (err, deleted) {
        if (err || !ids.length) {
          cb(err, deleted);
        } else {
          deleteCustomers(ids, cb);
        }
      });
    };
    deleteCustomers(customerIDs, callback);

  }
}
