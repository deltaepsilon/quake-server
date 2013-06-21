var conf = require('./convict.js'),
  fs = require('fs');

module.exports = {
	
	// Name of the application (used as default <title>)
	appName: "Sails Application",

	// Port this Sails application will live on
	port: conf.get('quake_port'),

	// The environment the app is deployed in 
	// (`development` or `production`)
	//
	// In `production` mode, all css and js are bundled up and minified
	// And your views and templates are cached in-memory.  Gzip is also used.
	// The downside?  Harder to debug, and the server takes longer to start.
	environment: 'development',

	// Logger
	// Valid `level` configs:
	// 
	// - error
	// - warn
	// - debug
	// - info
	// - verbose
	//
	log: {
		level: 'info'
	},

  session: {
    host: conf.get('redis_host'),
    port: conf.get('redis_port'),
    password: conf.get('redis_password'),
    secret: conf.get('redis_secret'),
    adapter: "redis"
  },

  express: {
    customMiddleware: function(app) {
      var passport = require('passport'),
        ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy,
        oauth2 = require('./../middleware/oauth2.js'),
        user = require('./../middleware/user.js'),
        BearerStrategy = require('passport-http-bearer').Strategy;

      //  Passport Init
      app.use(passport.initialize());

      passport.use(new ClientPasswordStrategy(oauth2.findByClientID));
      passport.use(new BearerStrategy(oauth2.findByToken));

      app.use(function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', "*"); // Necessary for cross-domain requests
        res.error = function (message, status) {
          this.send({error: message}, status || 400);
        }

        if (req.url.match(/^\/auth\//)) { // Whitelist all /auth/ routes
          return next();
        }
        passport.authenticate('bearer', {session: false})(req, res, next);
      });

      app.all('/user*', user);

      //  OAuth2 Routes
      app.get('/auth/authorize', oauth2.authorization);
      app.post('/auth/authorize/decision', oauth2.decision);
      app.post('/auth/token', oauth2.token);
    }
  }

};
