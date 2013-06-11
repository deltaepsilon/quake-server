/**
* Allow any authenticated user.
*/
module.exports = function (req, res, next) {
	
	// User is allowed, proceed to controller
  console.log('inside policty authenticated.js');
	if (req.isAuthenticated()) {
		return next();
	}

	// User is not allowed
	else {
		return res.send("You are not permitted to perform this action.",403);
	}
};