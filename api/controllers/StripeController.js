/*---------------------
	:: Stripe 
	-> controller
---------------------*/
var _ = require('underscore'),
  stripeService = require('./../services/stripeService.js'),
  callback = function (res) {
    return function (err, response) {
      if (err) {
        return res.error(err.message || err);
      }
      res.send(JSON.stringify(response));
    }
  }
  StripeController = {

    customer: function (req, res) {
      var localCallback = callback(res),
      query = _.extend(req.query || {}, req.params || {}, req.body || {}),
      id = query.customer_id || query.customerID;

      switch (req.method) {
        case 'GET':
          stripeService.getCustomer(id, localCallback);
          break;
        case 'DELETE':
          stripeService.deleteCustomer(id, localCallback);
          break;
        case 'PUT':
          stripeService.updateCustomer(id, req.body, localCallback);
          break;
        default:
          localCallback('Stripe customer http verb ' + req.method + ' not supported.')
          break;
      }


    },

    customers: function (req, res) {
      var localCallback = callback(res),
        query = _.extend(req.query || {}, req.params || {}, req.body || {});


      switch (req.method) {
        case 'GET':
          stripeService.listCustomers(query.count, query.offset, callback(res));
          break;
        case 'DELETE':
          stripeService.deleteCustomers(query.customerIDs, localCallback);
          break;
        default:
          localCallback('Stripe customer http verb ' + req.method + ' not supported.')
          break;
      }
    }

  };
module.exports = StripeController;