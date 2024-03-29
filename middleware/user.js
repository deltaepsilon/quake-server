/**
* Lock down User actions
*/
var normalizer = require('./../api/utilities/quake.js').paramNormalizer;

module.exports = function (req, res, next) {
	// User is allowed, proceed to controller
  if (!req.user || !req.user.clientID) {
    return res.send("You are not permitted to perform this action.", 403);
  } else if (req.user.clientID !== 'quiver' && req.method !== 'PUT') {
    return res.send("You are not permitted to perform this action.", 403);
  } else if (req.user.clientID !== 'quiver') {
    req.url = normalizer(req.url, req.user.clientID);
    req.query.id = req.user.clientID; //Force all user queries to have an id query param that matches the user's id.
  }
  next();

};