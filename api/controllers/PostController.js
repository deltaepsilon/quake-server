/*---------------------
	:: Post 
	-> controller
---------------------*/
var quakeUtil = require('./../utilities/quake.js'),
  Query = quakeUtil.query,
  generic = quakeUtil.generic;

var PostController = {
  destroyWhere: function (req, res) {
    generic(req, res, postService.destroy, ['userID'], ['where']);
  }


};
module.exports = PostController;