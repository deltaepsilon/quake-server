#!/usr/local/bin/node
var conf = require('../config/convict.js'),
  colors = require('colors'),
  fixtures = require('pow-mongodb-fixtures').connect(conf.get('mongo_db'), {
    host: conf.get('mongo_host'),
    port: conf.get('mongo_port'),
    user: conf.get('mongo_username'),
    pass: conf.get('mongo_password')
  });

console.log('############ Attempting to load users...');
fixtures.load(require('../fixtures/users.js'), function(result) {
  if (!result) {
    console.log('users loaded'.green);
  } else {
    console.log('users load fail! ' + result.red);
  }

  console.log('##############'.rainbow + ' Goodbye!');
  return process.exit(0);
});
