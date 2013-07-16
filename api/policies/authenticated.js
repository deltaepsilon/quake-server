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

    res.send = function (message) { // Patch res.send to emit instead
      req.socket.emit('message', message);
    };
    res.error = function (message) { // Patch res.error to emit instead
      req.socket.emit('error', message);
    }

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