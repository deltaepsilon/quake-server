var defer = require('node-promise').defer,
  deferred = defer(),
  mocha = require('mocha'),
  chai = require('chai'),
  assert = chai.assert,
  conf = require('./../../config/convict.js'),
  request = require('supertest'),
  quake = require('quake-sdk'),
  quakeServer = require('./../utility/server.js'),
  verbs,
  server,
  app,
  user,
  userToken;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //Allow https testing with self-signed certs

module.exports = function () {
  suite('Stripe', function() {
    suiteSetup(function(done) {
      quakeServer.startApp(function (aserver, aapp, auser, atoken, aheader, auserToken, auserHeader) {
        server = aserver;
        app = aapp;
        user = auser;
        userToken = auserToken;
        verbs = require('./../utility/verbs.js')(app);
        done();
      })
    });

    suiteTeardown(function(done) {
      quakeServer.cleanUser(user, function () {
        quakeServer.stopApp(server, function () {
          deferred.resolve(done);
        });
      });
    });


    /*
     *  Four Cases
     *  1. User creating card and subscription: customer.object === 'token' && (!user.stripe || !user.stripe.customer)
     *  2. User is changing card but not subscription: req.body.stripe.customer.object === 'token' && req.body.stripe.plan === user.stripe.customer.subscription.plan.id
     *  3. User is changing subscription but not card: req.body.stripe.customer.object === 'customer' && req.body.stripe.plan !== user.stripe.customer.subscription.plan.id
     *  4. User is changing both subscription and card: req.body.stripe.customer.object === 'token' && req.body.stripe.plan !== user.stripe.customer.subscription.plan.id
     */

    var stripeUser;
    test('POST to /user/subscribe with token and no current stripe customer should create a new customer and a new subscription.', function (done) {
      var mockStripeCustomer = require('./../mocks/stripeCustomerMock.js');
      verbs.put('/user/subscribe', userToken).send({stripe: {coupon: 'neverpayforanything', plan: "quiver100", customer: mockStripeCustomer}}).end(function (err, res) {
        var user = JSON.parse(res.text);
        stripeUser = user;
        assert.equal(user.stripe.customer.active_card.object, 'card', 'User should now have a stripe card.');
        assert.equal(user.stripe.customer.subscription.object, 'subscription', 'User should now have a stripe subscription.');
        assert.equal(user.stripe.customer.discount.object, 'discount', 'User should now have a discount.');
        done();
      });
    });

    test('POST to /user/subscribe with no plan change any a new card should return updated card', function (done) {
      var mockStripeCustomer = require('./../mocks/stripeCustomerMock.js');
      mockStripeCustomer.card.number = '5555555555554444'; //Valid MasterCard number
      mockStripeCustomer.card.last4 = '4444'; //Valid MasterCard number
      verbs.put('/user/subscribe', userToken).send({stripe: {customer: {card: mockStripeCustomer.card}}}).end(function (err, res) {
        var user = JSON.parse(res.text);
        assert.equal(user.stripe.customer.active_card.type, 'MasterCard', 'Should return updated card');
        assert.equal(user.stripe.customer.subscription.plan.id, 'quiver100', 'Should return same');
        done();
      });
    });

    test('POST to /user/subscribe with plan change and no card should return updated plan', function (done) {
      verbs.put('/user/subscribe', userToken).send({stripe: {plan: "quiver0", coupon: "neverpayforanything"}}).end(function (err, res) {
        var user = JSON.parse(res.text);
        assert.equal(user.stripe.customer.active_card.type, 'MasterCard', 'Should return same card');
        assert.equal(user.stripe.customer.subscription.plan.id, 'quiver0', 'Should return updated subscription');
        done();
      });
    });

    test('POST to /user/subscribe with plan change and card change should return updated plan', function (done) {
      var mockStripeCustomer = require('./../mocks/stripeCustomerMock.js');
      mockStripeCustomer.card.number = '4242424242424242'; //Valid Visa number
      mockStripeCustomer.card.last4 = '4242';
      verbs.put('/user/subscribe', userToken).send({stripe: {customer: mockStripeCustomer, plan: 'quiver100'}}).end(function (err, res) {
        var user = JSON.parse(res.text);
        assert.equal(user.stripe.customer.active_card.type, 'Visa', 'Should updated same card');
        assert.equal(user.stripe.customer.subscription.plan.id, 'quiver100', 'Should return updated subscription');
        done();
      });
    });

    test('GET to /stripe/customers should fail without a matching admin email.', function (done) {
      verbs.get('/stripe/customers').end(function (err, res) {
        var response = JSON.parse(res.text);
        assert.equal(response.error, 'You are not permitted to perform this action.', 'GET to /stripe/customers should fail without a matching admin email.');
        done();
      });
    });

    test('GET to /stripe/customer should return the customer', function (done) {
      verbs.get('/stripe/customer?customer_id=' + stripeUser.stripe.customer.id, userToken).end(function (err, res) {
        var customer = JSON.parse(res.text);
        assert.equal(customer.id, stripeUser.stripe.customer.id, 'Stripe customer id should match');
        done();
      });
    });

    test('GET to /stripe/customer should return the customer', function (done) {
      verbs.put('/stripe/customer?customer_id=' + stripeUser.stripe.customer.id, userToken).send({plan: 'quiver0'}).end(function (err, res) {
        var customer = JSON.parse(res.text);
        assert.equal(customer.subscription.plan.id, 'quiver0', 'Stripe plan should be updated');
        done();
      });
    });

    test('GET to /stripe/customers should succeed with admin user token and result should include mock customer.', function (done) {
      verbs.get('/stripe/customers', userToken).end(function (err, res) {
        var response = JSON.parse(res.text),
          customers = response.data,
          i = customers.length,
          customer;

        assert.equal(response.object, 'list', 'Should return customer object from Stripe');
        while(i--) {
          if (customers[i].id === stripeUser.stripe.customer.id) {
            customer = customers[i];
            break;
          }
        }
        assert.equal(customer.id, stripeUser.stripe.customer.id, 'Stripe user should be among listed customers');

        done();
      });
    });



    test('GET to /stripe/customer should return the customer', function (done) {
      verbs.del('/stripe/customer', userToken).send({customer_id: stripeUser.stripe.customer.id}).end(function (err, res) {
        var response = JSON.parse(res.text);
        assert.isTrue(response.deleted, 'Delete should be successful');
        assert.equal(stripeUser.stripe.customer.id, response.id, 'Deleted id should match');
        done();
      });
    });
//
//    test('DELETE to /stripe/customers should wipe out ALL OF THE CUSTOMERS', function (done) {
//      verbs.get('/stripe/customers', userToken).end(function (err, res) {
//        var response = JSON.parse(res.text),
//          customers = response.data,
//          i = customers.length,
//          customerIDs = [];
//        while (i--) {
//          customerIDs.push(customers[i].id);
//        }
//
//        if (!customerIDs.length) {
//          console.log('No customers to practice deleting');
//          return done();
//        }
//
//        verbs.del('/stripe/customers', userToken).send({customerIDs: customerIDs}).end(function (err, res) {
//          var deleteResponse = JSON.parse(res.text);
//          assert.isTrue(deleteResponse.deleted);
//          assert.deepEqual(deleteResponse.ids, customerIDs, 'All deleted customer ids should be present in response');
//          done();
//        });
//      });
//    });

  });

  return deferred.promise;
}
