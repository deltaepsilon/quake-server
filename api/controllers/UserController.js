/*---------------------
	:: User 
	-> controller
---------------------*/
var _ = require('underscore'),
  uuid = require('node-uuid'),
  userService = require('./../services/userService.js'),
  stripeService = require('./../services/stripeService.js'),
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
          return res.json(userService.scrubUser(model));
        }

      });
    },

    subscribe: function (req, res) {
      User.findById(req.user.clientID, function (err, user) {
        if (!req.body) {
          return res.error('Request body missing');
        }
        if (!req.body.stripe) {
          return res.error('Stripe object missing');
        }
        if (!req.body.stripe.customer && !req.body.stripe.plan) {
          return res.error('Stripe customer and plan missing');
        }

        /*
         *  Four Cases
         *  1. User creating card and subscription: customer.object === 'token' && (!user.stripe || !user.stripe.customer)
         *  2. User is changing card but not subscription: req.body.stripe.customer.object === 'token' && req.body.stripe.plan === user.stripe.customer.subscription.plan.id
         *  3. User is changing subscription but not card: req.body.stripe.customer.object === 'customer' && req.body.stripe.plan !== user.stripe.customer.subscription.plan.id
         *  4. User is changing both subscription and card: req.body.stripe.customer.object === 'token' && req.body.stripe.plan !== user.stripe.customer.subscription.plan.id
        */



        var customer = req.body.stripe.customer,
          customerType = customer ? customer.object : null,
          currentCustomer = user.stripe && user.stripe.customer,
          currentLast4 = currentCustomer && currentCustomer.active_card ? currentCustomer.active_card.last4 : null,
          proposedLast4 = customer && customer.card ? customer.card.last4: null,
          token = (customerType === 'token') ? customer.id : null,
          newCard = token || (proposedLast4 && proposedLast4 !== currentLast4),
          proposedPlan = req.body.stripe.plan,
          currentPlan = (user.stripe && user.stripe.customer && user.stripe.customer.subscription && user.stripe.customer.subscription.plan) ? user.stripe.customer.subscription.plan.id : false,
          description = user.displayName + ": " + user.emails[0].value,
          coupon = req.body.stripe.coupon,
          callback = function (err, customer) {
            if (err) {
              res.error(err.message);
            } else {
              req.body = {stripe: {customer: customer}};
              UserController.update(req, res);
            }

          };


        if (newCard) {
          if (!currentPlan && proposedPlan) { //Case 1: Create a new customer with subscription
            stripeService.createSubscription(proposedPlan, customer, description, coupon, callback);

          } else if (!proposedPlan || currentPlan === proposedPlan) { //Case 2: Just update card
            stripeService.updateCard(token, customer, currentCustomer, callback);

          } else if (currentPlan !== proposedPlan) { //Case 4: Update plan and card
            stripeService.updateSubscription(token, proposedPlan, customer, currentCustomer, coupon, callback);

          } else {
            res.error('Subscribe request was incomplete');

          }

        } else if (!currentPlan || currentPlan !== proposedPlan) { //Case 3: Update just subscription
          stripeService.updateSubscription(token, proposedPlan, customer, currentCustomer, coupon, callback);

        } else if (coupon) { // Update anything you can... this is currently used for updating promo codes
          stripeService.updateSubscription(token, proposedPlan, customer, currentCustomer, coupon, callback);
        } else {
          res.error('Subscribe request was incomplete');

        }
      });

    }
  };
module.exports = UserController;