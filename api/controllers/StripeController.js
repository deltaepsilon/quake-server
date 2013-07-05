/*---------------------
	:: Stripe 
	-> controller
---------------------*/
var _ = require('underscore'),
  stripeService = require('./../services/stripeService.js'),
  Handler = require('./../utilities/quake.js').handler,
  defaultError = function (req, res, name) {
    res.error('Http verb: ' + req.method + ' not supported by ' + name);
  },
  StripeController = {
    customer: function (req, res) {
      var handler = new Handler(res),
      query = _.extend(req.query || {}, req.params || {}, req.body || {}),
      id = query.customer_id || query.customerID;

      switch (req.method) {
        case 'GET':
          stripeService.getCustomer(id).then(handler.success, handler.error);
          break;
        case 'DELETE':
          stripeService.deleteCustomer(id).then(handler.success, handler.error);
          break;
        case 'PUT':
          stripeService.updateCustomer(id, req.body).then(handler.success, handler.error);
          break;
        default:
          defaultError(req, res, 'stripe.customer');
          break;
      }

    },

    customers: function (req, res) {
      var handler = new Handler(res),
        query = _.extend(req.query || {}, req.params || {}, req.body || {});

      switch (req.method) {
        case 'GET':
          stripeService.listCustomers(query.count, query.offset).then(handler.success, handler.error);
          break;
        case 'DELETE':
          stripeService.deleteCustomers(query.customerIDs).then(handler.success, handler.error);
          break;
        default:
          defaultError(req, res, 'stripe.customers');
          break;
      }

    }
  };
module.exports = StripeController;