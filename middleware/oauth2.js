var conf = require('./../config/convict.js')
  passport = require('passport'),
  oauth2orize = require('oauth2orize'),
  server = oauth2orize.createServer(),
  uuid = require('node-uuid'),
  User = sails.models.user,
  AuthorizationCode = sails.models.authorizationcode,
  AccessToken = sails.models.accesstoken;

server.serializeClient(function(client, done) {
  return done(null, client.id);
});

server.deserializeClient(function(id, done) {
  if (id === 'quiver') {
    done(null, { id: 'quiver' });
  } else {
    User.findById(id, function(err, user) {
      done(null, user);
    });
  }
});

server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
  if (!user) {
    user = {id: 'quiver'}
  }

  AuthorizationCode.create({
      code: uuid.v4(),
      clientID: client.id,
      redirectURI: redirectURI,
      userID: user.id
    }, function(err, model) {
      if (err) {
        return done(err);
      } else {
        return done(null, model.code);
      }
    });
}));

server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
  if (client.id === 'quiver') {
    AccessToken.create({
      token: uuid.v4(),
      userID: 'quiver',
      clientID: 'quiver'
    }, function(err, model) {
      if (err) { return done(err); }
      done(null, model.token);
    });
  } else {
    AuthorizationCode.find(code, function(err, authorizationCode) {
      if (err) { return done(err); }
      if (client.id !== authorizationCode.clientID) { return done(null, false); }
      if (redirectURI !== authorizationCode.redirectURI) { return done(null, false); }

      AccessToken.create({
        token: uuid.v4(),
        userID: authorizationCode.userID,
        clientID: authorizationCode.clientID
      }, function(err, model) {
        if (err) { return done(err); }
        done(null, model.token);
      });
    });
  }
}));

module.exports = {
  authorization: [
    server.authorization(function(clientID, redirectURI, done) {
      if (clientID === conf.get('client_id')) {
        return done(null, {id: 'quiver'}, redirectURI);
      } else {
        User.find({clientID: clientID}, function(err, client) {
          if (err || !client) { return done(err); }
          return done(null, client, redirectURI);
        });
      }
    }),
    function(req, res) {
      res.header('Content-Type', 'text/json');
      res.end(JSON.stringify({
        transaction_id: req.oauth2.transactionID,
        user: req.user || {},
        client: req.oauth2.client
      }));
    }
  ],
  decision: [server.decision()],
  token: [
    passport.authenticate(['oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler()
  ],
  findByClientID: function (clientID, clientSecret, done) { // Let the Quiver app through. TODO let individual users authenticate as well
    if (clientID === conf.get('client_id') && clientSecret === conf.get('client_secret')) {
      done(null, {id: 'quiver'});
    } else {
      done('Client not found.');
    }
  },
  findByToken: function (token, done) { // Find and return users.
    AccessToken.find({token: token}, function (err, token) {
      if (err) {
        return done(err);
      }
      console.log('found user by token... should start finding full user. userID =', token.userID);
      done(null, token);
    });
  }
}