/**
* Allow any authenticated user.
*/
module.exports = function (req, res, next) {
	
	// User is allowed, proceed to controller
	if (req.isAuthenticated()) {
    //TODO add user deets to all incoming requests, unless that user is admin
		return next();
	}

	// User is not allowed
	else {
		return res.send("You are not permitted to perform this action.", 403);
	}
};