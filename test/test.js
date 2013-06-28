var mocha = require('mocha'),
  chai = require('chai'),
  assert = chai.assert,
  conf = require('./../config/convict.js'),
  request = require('supertest'),
  sails = require('sails'),
  userMock = require('./mocks/userMock.js'),
  quake = require('quake-sdk'),
  quakeRoot = conf.get('quake_external'),
  decisionApp = require('express')(),
  server,
  app;

function post (path, token) { // Post with authorization token header
  return request(app).post(path).set('authorization', token ? 'Bearer ' + token : global.quakeSDKHeader);
}

function put (path, token) { // Put with authorization token header
  return request(app).put(path).set('authorization', token ? 'Bearer ' + token : global.quakeSDKHeader);
}

function del (path, token) { // Delete with authorization token header
  return request(app).del(path).set('authorization', token ? 'Bearer ' + token : global.quakeSDKHeader);
}

function get (path, token) { // Get with authorization token params
  return request(app).get(path).query({access_token: token || global.quakeSDKToken}).query({token_type: 'bearer'});
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //Allow https testing with self-signed certs

suite('Auth', function() {
  suiteSetup(function(done) {
    decisionApp.use(quake.middleware.decision);
    server = decisionApp.listen(conf.get('quiver_port'));

    sails.lift({
      port: conf.get('quake_port')
    }, function() {
      app = sails.sails.express.app;
      quake.auth.getToken('quiver', null, null, function (token, header) {
        global.quakeSDKHeader = header;
        global.quakeSDKToken = token;
        done();
      });
    });
  });

  suiteTeardown(function(done) {
    server.close();
    sails.lower();
    done();
  });


  test('Auth should fail at / route without token', function(done) {
    request(app).get('/').end(function (err, res) {
      assert.equal(res.text, 'Unauthorized', 'Auth should fail at / route without token');
      done();
    });
  });


//  test('Auth/authorize should return clientID from env vars', function(done) {
//    var redirectURI = quakeRoot + '/auth/callback';
//    request(app).get('/auth/authorize?client_id=' + conf.get('client_id') + '&response_type=code&redirect_uri=' + redirectURI).expect(200).expect('Content-Type', 'text/json').end(function(err, res) {
//      var params = JSON.parse(res.text),
//        decision = request(app).post('/auth/authorize/decision'),
//        token = request(app).post('/auth/token'),
//        cookies = res.headers['set-cookie'].pop().split(';')[0];
//
//      decision.cookies = cookies;
//      token.cookies = cookies;
//
//      assert.equal(params.client.id, 'quiver', 'auth/authorize with the core application client_id returns said client_id');
//      decision.send({transaction_id: params.transaction_id, user: 'quiver'}).expect(302).end(function(err, res) {
//        if (err) { throw new Error(err); }
//
//        var code = res.header.location.match(/code=(.+)/)[1];
//
//        token.send({grant_type: 'authorization_code', code: code, client_id: conf.get('client_id'), client_secret: conf.get('client_secret'), redirect_uri: redirectURI}).end(function(err, res) {
//          var tokenParams = JSON.parse(res.text);
//
//          assert.isNotNull(tokenParams.access_token, 'Access token should be present');
//          assert.equal(tokenParams.token_type, 'bearer', 'Token type should be bearer');
//          done();
//        });
//
//      });
//    });
//  });

  var user;
  test('findOrCreate route should create an identical new user', function(done) {
    post('/user/findOrCreate').send(userMock).end(function (err, res) {
      user = JSON.parse(res.text);
      assert.equal(userMock.id, user.providerID, 'findOrCreate route should create an identical new user');
      assert.equal(user.clientID.length, 36 , 'New user should have a clientID');
      assert.equal(user.clientSecret.length, 36 , 'New user should have a clientSecret');
      done();
    });
  });

  var userToken;
  test('Auth as the new user', function(done) {
    quake.auth.getToken(user.id, user.clientID, user.clientSecret, function (token, header) {
      userToken = token;
      assert.equal(token.length, 36 , 'Should return user token');
      done();
    });
  });

  test('PUT to /user/update/1 should return the edited user. The number in the path can be arbitrary.', function (done) {
    put('/user/update/', userToken).send({emails: [{value: "chris@quiver.is"}]}).end(function (err, res) {
      var updatedUser = JSON.parse(res.text);
      assert.equal('chris@quiver.is', updatedUser.emails[0].value, 'Email should be persisted to existing user');
      assert.equal(user.id, updatedUser.id, 'Updated user should have same ID');
      assert.isUndefined(updatedUser.clientID, 'updates should not pass back clientID');
      assert.isUndefined(updatedUser.clientSecret, 'updates should not pass back clientSecret');
      assert.isUndefined(updatedUser._json, 'updates should not pass back _json');
      assert.isUndefined(updatedUser._raw, 'updates should not pass back _raw');

      done();
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
    var mockStripeCustomer = require('./mocks/stripeCustomerMock.js');
    put('/user/subscribe', userToken).send({stripe: {coupon: 'neverpayforanything', plan: "quiver100", customer: mockStripeCustomer}}).end(function (err, res) {
      var user = JSON.parse(res.text);
      stripeUser = user;
      assert.equal(user.stripe.customer.active_card.object, 'card', 'User should now have a stripe card.');
      assert.equal(user.stripe.customer.subscription.object, 'subscription', 'User should now have a stripe subscription.');
      assert.equal(user.stripe.customer.discount.object, 'discount', 'User should now have a discount.');
      done();
    });
  });

  test('POST to /user/subscribe with no plan change any a new card should return updated card', function (done) {
    var mockStripeCustomer = require('./mocks/stripeCustomerMock.js');
    mockStripeCustomer.card.number = '5555555555554444'; //Valid MasterCard number
    mockStripeCustomer.card.last4 = '4444'; //Valid MasterCard number
    put('/user/subscribe', userToken).send({stripe: {customer: {card: mockStripeCustomer.card}}}).end(function (err, res) {
      var user = JSON.parse(res.text);
      assert.equal(user.stripe.customer.active_card.type, 'MasterCard', 'Should return updated card');
      assert.equal(user.stripe.customer.subscription.plan.id, 'quiver100', 'Should return same');
      done();
    });
  });

  test('POST to /user/subscribe with plan change and no card should return updated plan', function (done) {
    put('/user/subscribe', userToken).send({stripe: {plan: "quiver0", coupon: "neverpayforanything"}}).end(function (err, res) {
      var user = JSON.parse(res.text);
      assert.equal(user.stripe.customer.active_card.type, 'MasterCard', 'Should return same card');
      assert.equal(user.stripe.customer.subscription.plan.id, 'quiver0', 'Should return updated subscription');
      done();
    });
  });

  test('POST to /user/subscribe with plan change and card change should return updated plan', function (done) {
    var mockStripeCustomer = require('./mocks/stripeCustomerMock.js');
    mockStripeCustomer.card.number = '4242424242424242'; //Valid Visa number
    mockStripeCustomer.card.last4 = '4242';
    put('/user/subscribe', userToken).send({stripe: {customer: mockStripeCustomer, plan: 'quiver100'}}).end(function (err, res) {
      var user = JSON.parse(res.text);
      assert.equal(user.stripe.customer.active_card.type, 'Visa', 'Should updated same card');
      assert.equal(user.stripe.customer.subscription.plan.id, 'quiver100', 'Should return updated subscription');
      done();
    });
  });

  test('GET to /stripe/customers should fail without a matching admin email.', function (done) {
    get('/stripe/customers').end(function (err, res) {
      var response = JSON.parse(res.text);
      assert.equal(response.error, 'You are not permitted to perform this action.', 'GET to /stripe/customers should fail without a matching admin email.');
      done();
    });
  });

  test('GET to /stripe/customer should return the customer', function (done) {
    get('/stripe/customer?customer_id=' + stripeUser.stripe.customer.id, userToken).end(function (err, res) {
      var customer = JSON.parse(res.text);
      assert.equal(customer.id, stripeUser.stripe.customer.id, 'Stripe customer id should match');
      done();
    });
  });

  test('GET to /stripe/customer should return the customer', function (done) {
    put('/stripe/customer?customer_id=' + stripeUser.stripe.customer.id, userToken).send({plan: 'quiver0'}).end(function (err, res) {
      var customer = JSON.parse(res.text);
      assert.equal(customer.subscription.plan.id, 'quiver0', 'Stripe plan should be updated');
      done();
    });
  });

  test('GET to /stripe/customers should succeed with admin user token and result should include mock customer.', function (done) {
    get('/stripe/customers', userToken).end(function (err, res) {
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
    del('/stripe/customer', userToken).send({customer_id: stripeUser.stripe.customer.id}).end(function (err, res) {
      var response = JSON.parse(res.text);
      assert.isTrue(response.deleted, 'Delete should be successful');
      assert.equal(stripeUser.stripe.customer.id, response.id, 'Deleted id should match');
      done();
    });
  });

  test('DELETE to /stripe/customers should wipe out ALL OF THE CUSTOMERS', function (done) {
    get('/stripe/customers', userToken).end(function (err, res) {
      var response = JSON.parse(res.text),
        customers = response.data,
        i = customers.length,
        customerIDs = [];
      while (i--) {
        customerIDs.push(customers[i].id);
      }
      del('/stripe/customers', userToken).send({customerIDs: customerIDs}).end(function (err, res) {
        var deleteResponse = JSON.parse(res.text);
        assert.isTrue(deleteResponse.deleted);
        assert.deepEqual(deleteResponse.ids, customerIDs, 'All deleted customer ids should be present in response');
        done();
      });
    });
  });

  test('Remove user that was just found or created', function (done) {
    del('/user').send({id: user.id}).end(function (err, res) {
      var destroyed = JSON.parse(res.text);
      assert.equal(user.id, destroyed.id, 'Remove user that was just found or created');
      done();
    });
  });
});