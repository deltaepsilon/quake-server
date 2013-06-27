/**
 * Allow any admin.
 */
var _ = require('underscore'),
  conf = require('./../../config/convict.js'),
  emailList = conf.get('admin_email'),
  emails = emailList ? emailList.split('|') : [];
module.exports = function (req, res, next) {

  // User is allowed, proceed to controller
  if (req.user.clientID === 'quiver') {
    return res.error("You are not permitted to perform this action.", 403);
  }

  User.findById(req.user.clientID, function (err, user) {
    if (user && user.emails && user.emails[0] && _.contains(emails, user.emails[0].value)) {
      return next();
    } else {
      return res.error("You are not permitted to perform this action.", 403);
    }
  });

};
