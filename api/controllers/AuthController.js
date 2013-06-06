/*---------------------
	:: Auth 
	-> controller
---------------------*/
var AuthController = {

	// To trigger this action locally, visit: `http://localhost:port/auth/index`
	index: function (req,res) {

		// This will render the view: /Users/christopheresplin/Development/quake/views/auth/index.ejs
		res.view();

	},

  authenticate: function(req, res) {

  }

};
module.exports = AuthController;