var _ = require('underscore'),
  conf = require('./../../config/convict.js'),
  stripe = require('stripe')(conf.get('stripe_sk')),
  defer = require('node-promise').defer,
  Resolver = require('./../utilities/quake.js').resolver;

module.exports = {
  createSubscription: function (plan, customer, description, coupon) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      payload = {
      card: customer.id || customer.card,
      plan: plan,
      description: description
    };

    if (coupon) {
      payload.coupon = coupon;
    }

    stripe.customers.create(payload, resolver.done);
    return deferred.promise;

  },

  /*
   *  TODO Edit subscription should take plan changes and card changes.
   *  Test both
  */



  updateSubscription: function (token, plan, proposedCustomer, customer, coupon) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      payload = {};

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
        resolver.reject(err);
      } else {
        stripe.customers.retrieve(customer.id, resolver.done);
      }

    });
    return deferred.promise;
  },

  updateCard: function (token, proposedCustomer, customer, callback) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      updates = {
        card: token || proposedCustomer.card
      };

    stripe.customers.update(customer.id, updates, resolver.done);
    return deferred.promise;
  },

  getCustomer: function (id) {
    var deferred = defer(),
      resolver = new Resolver(deferred);
    stripe.customers.retrieve(id, resolver.done);
    return deferred.promise;
  },

  deleteCustomer: function (id) {
    var deferred = defer(),
      resolver = new Resolver(deferred);
    stripe.customers.del(id, resolver.done);
    return deferred.promise;
  },

  updateCustomer: function (id, updates) {
    var deferred = defer(),
      resolver = new Resolver(deferred);
    stripe.customers.update(id, updates, resolver.done);
    return deferred.promise;
  },

  listCustomers: function (count, offset) {
    var deferred = defer(),
      resolver = new Resolver(deferred);
    stripe.customers.list(count || 10, offset || 0, resolver.done);
    return deferred.promise;
  },

  deleteCustomers: function (customerIDs, callback) {
    var deferred = defer(),
      resolver = new Resolver(deferred);

    if (!conf.get('env') === 'development') {
      resolver.reject('You cannot delete all customers outside of a development environment.');
    } else if (!customerIDs) {
      resolver.reject('customerIDs missing from delete params');
    } else {
      var originalIDs = _.clone(customerIDs),
        customCallback = function (err, response) {
          if (err) {
            resolver.reject(err);
          } else {
            resolver.resolve({deleted: true, ids: originalIDs});
          }

        },
        deleteCustomers = function (ids, cb) {
          stripe.customers.del(ids.pop(), function (err, deleted) {
            if (err || !ids.length) {
              cb(err, deleted);
            } else {
              deleteCustomers(ids, customCallback);
            }
          });
        };
      deleteCustomers(customerIDs, customCallback);
    }
    return deferred.promise;

  }
}
