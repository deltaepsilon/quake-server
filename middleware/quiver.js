/**
 * Allow any authenticated user.
 */
var quakeUtil = require('./../api/utilities/quake.js'),
  normalizer = quakeUtil.paramNormalizer,
  getMongoID = quakeUtil.getMongoID;

module.exports = function (req, res, next) {
  var where;
  // User is allowed, proceed to controller
  if (!req.user || !req.user.clientID) {
    return res.send("You are not permitted to perform this action.", 403);
  } else if (req.user.clientID !== 'quiver') {

    req.url = normalizer(req.url);

    if (req.originalUrl.match(/findAll/i)) { // model.findAll relies on req.query.where, which must be stringified
      where = req.param('where');
      where = where ? JSON.parse(where) : {};
      where.userID = getMongoID(req.user.clientID);
      req.body.where = JSON.stringify(where);
    } else {
      req.query.userID = getMongoID(req.user.clientID); //Force all user queries to have an id query param that matches the user's id.
    }
  }

  if (req.query.userID) {
    req.query.userID = getMongoID(req.query.userID);
  }

  if (req.params.userID) {
    req.params.userID = getMongoID(req.params.userID);
  }

  if (req.body.userID) {
    req.body.userID = getMongoID(req.body.userID);
  }

  where = req.param('where');
  if (where) {
    where = JSON.parse(where);
    where.userID = getMongoID(req.user.clientID);
    req.body.where = where;
  }

  next();

};