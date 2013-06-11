/**
* Allow any authenticated user.
*/
module.exports = function (req, res, next) {
	
	// User is allowed, proceed to controller
  next();
//	if (req.isAuthenticated()) {
//		return next();
//	}
//
//	// User is not allowed
//	else {
//		return res.send("You are not permitted to perform this action.",403);
//	}
};