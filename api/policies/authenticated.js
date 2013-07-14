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
      req.socket.emit('error', message);

    }

  };
	
	// User is allowed, proceed to controller
  if (req.isSocket) { // Do a quick token search for socket connections
//    console.log('req', req.socket.manager.rooms);
//    console.log('\n\n\n\n\nres', res);
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