var conf = require('./../config/convict.js')
  passport = require('passport'),
  oauth2orize = require('oauth2orize'),
  server = oauth2orize.createServer(),
  uuid = require('node-uuid'),
  defer = require('node-promise').defer,
  Resolver = require('./../api/utilities/quake.js').resolver,
  Query = require('./../api/utilities/quake.js').query,
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
  AuthorizationCode.destroy({clientID: client.id}, function (err, count) {
    if (err) {
      return ares.error({error: err});
    }
    AuthorizationCode.create({
      code: uuid.v4(),
      clientID: client.id,
      redirectURI: redirectURI
//     , userID: user.id
    }, function(err, model) {
      if (err) {
        return done(err);
      } else {
        return done(null, model.code);
      }
    });
  });

}));

server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
  AuthorizationCode.find({code: code} , function(err, authorizationCode) {
    if (err) { return done(err); }
    if (client.id.toString() !== authorizationCode.clientID.toString()) { return done(null, false); }
    if (redirectURI !== authorizationCode.redirectURI) { return done(null, false); }

    AccessToken.destroy({clientID: authorizationCode.clientID}, function (err) {
      if (err) {return done(err);}
      AccessToken.create({
        token: uuid.v4(),
        userID: authorizationCode.userID,
        clientID: authorizationCode.clientID
      }, function(err, model) {
        if (err) { return done(err); }
        AuthorizationCode.destroy({clientID: authorizationCode.clientID}, function (err) {
          if (err) { return done(err) }
          done(null, model.token);
        });
      });

    });
  });
}));

var oauth2 = {
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
  findByClientID: function (clientID, clientSecret, done) { // Let the Quiver app through.
    var deferred = defer(),
      resolver = new Resolver(deferred),
      quiver = {id: 'quiver'};
    if (clientID === conf.get('client_id') && clientSecret === conf.get('client_secret')) {
      resolver.done(null, quiver);
      if (typeof done === 'function') {
        done(null, quiver);
      }

    } else {
      User.find({clientID: clientID, clientSecret: clientSecret}, function (err, user) {
        resolver.done(err, user);
        if (typeof done === 'function') {
          done(err, user);
        }

      });
    }
  },
  findByToken: function (token, done) { // Find and return users.
    var deferred = defer(),
      resolver = new Resolver(deferred);
    AccessToken.find({token: token}, function (err, foundToken) {
      resolver.done(err, foundToken);
      if (typeof done === 'function') {
        done(null, foundToken);
      }

    });
    return deferred.promise;

  },
  authSocket: function (req) {
    var deferred = defer(),
      resolver = new Resolver(deferred),
      query = new Query(req).augment(),
      token = query ? query.access_token : null;

    if (!token) {
      deferred.reject('Auth token missing')
    } else {

      oauth2.findByToken(token).then(function (token) {
        if (!token || !token.clientID) {
          resolver.reject('Auth token not found');
        } else {
          User.findById(token.clientID, resolver.done);
        }

      }, resolver.reject);
    }
    return deferred.promise;

  }
}

module.exports = oauth2;