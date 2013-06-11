/*---------------------
	:: User 
	-> controller
---------------------*/
var User = sails.models.user,
  UserController = {
  findOrCreate: function (req, res, next) {
    var qUser = req.body;
    qUser.providerID = qUser.id;
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