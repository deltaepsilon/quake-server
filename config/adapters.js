var conf = require('./convict.js');

// Configure installed adapters
// If you define an attribute in your model definition, 
// it will override anything from this global config.
module.exports.adapters = {

	// If you leave the adapter config unspecified 
	// in a model definition, 'default' will be used.
	'default': 'mongo',
	
	// In-memory adapter for DEVELOPMENT ONLY
	// (data is NOT preserved when the server shuts down)
	memory: {
		module: 'sails-dirty',
		inMemory: true
	},

	// Persistent adapter for DEVELOPMENT ONLY
	// (data IS preserved when the server shuts down)
	// PLEASE NOTE: disk adapter not compatible with node v0.10.0 currently 
	//				because of limitations in node-dirty
	//				See https://github.com/felixge/node-dirty/issues/34
	disk: {
		module: 'sails-dirty',
		filePath: './.tmp/dirty.db',
		inMemory: false
	},

	// MySQL is the world's most popular relational database.
	// Learn more: http://en.wikipedia.org/wiki/MySQL
	mysql: {
		module		: 'sails-mysql',
		host		: 'YOUR_MYSQL_SERVER_HOSTNAME_OR_IP_ADDRESS',
		user		: 'YOUR_MYSQL_USER',
		password	: 'YOUR_MYSQL_PASSWORD',
		database	: 'YOUR_MYSQL_DB'
	},

  mongo: {
    module: 'sails-mongo',
    url: 'mongodb://' + conf.get('mongo_host') + ':' + conf.get('mongo_port') + '/' + conf.get('mongo_db')
//    url: 'mongodb://' + conf.get('mongo_username') + ':' + conf.get('mongo_password') + '@' + conf.get('mongo_host') + ':' + conf.get('mongo_port') + '/' + conf.get('mongo_db')
  }
};