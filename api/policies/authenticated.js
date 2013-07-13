/**
* Allow any authenticated user.
*/
var oauth2 = require('./../../middleware/oauth2.js');

module.exports = function (req, res, next) {
  var reject = function (message) {
    if (res.error) {
      return res.error("You are not permitted to perform this action.", 403);
    } else {
      console.log(new Error(message).stack);
      this.send({error: message}, 400);

    }

  };
	
	// User is allowed, proceed to controller
  if (req.isSocket) { // Do a quick token search for socket connections
    oauth2.authSocket(req).then(function (user) {
      req.user = user;
      req.params.userID = user.id;
      next();

    }, reject);

  } else if (req.isAuthenticated()) { // Rely on passport middleware for Express connections
		return next();

	} else { // Send fools home to mama
		return reject();

	}
};