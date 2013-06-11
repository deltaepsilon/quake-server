/*---------------------
	:: User 
	-> controller
---------------------*/
var User = sails.models.user,
  UserController = {
  findOrCreate: function (req, done) {
    console.log('findOrCreate req, res', req, done);
    var qUser = req.query.user;
    qUser.providerID = qUser.id;
    User.findOrCreate({providerID: qUser.providerID}, qUser, function (err, user) {
      if (err) {
        done(err);
      } else {
        done(null, user);
      }
    });
  }

};
module.exports = UserController;