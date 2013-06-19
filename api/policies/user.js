/**
* Allow any authenticated user.
*/
module.exports = function (req, res, next) {
	
	// User is allowed, proceed to controller
  if (req.user.clientID !== 'quiver') {
    if (req.method !== 'PUT') {
      return res.send("You are not permitted to perform this action.", 403);
    }
  }
  return next();
};