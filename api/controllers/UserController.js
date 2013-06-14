/*---------------------
	:: User 
	-> controller
---------------------*/
var uuid = require('node-uuid'),
  UserController = {
  findOrCreate: function (req, res, next) {
    var qUser = req.body;

    // Augment the user a bit just in case he/she gets saved. Won't affect existing users.
    qUser.providerID = qUser.id;
    qUser.clientID = uuid.v4();
    qUser.clientSecret = uuid.v4();

    User.findOrCreate({providerID: qUser.providerID}, qUser, function (err, user) {
      res.setHeader('Content-Type', 'text/json');
      if (err) {
        res.end(JSON.stringify('err'));
      } else {
        res.end(JSON.stringify(user));
      }
    });
  }

};
module.exports = UserController;