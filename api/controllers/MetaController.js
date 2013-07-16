/*---------------------
	:: Meta 
	-> controller
---------------------*/
var modelService = require('./../services/modelService.js'),
  quakeUtil = require('./../utilities/quake.js'),
  Query = quakeUtil.query,
  generic = quakeUtil.generic;

var MetaController = {
  destroyWhere: function (req, res) {
    generic(req, res, modelService.destroy, ['entity', 'userID'], ['where']);
  }

};
module.exports = MetaController;