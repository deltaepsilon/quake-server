var id = require('pow-mongodb-fixtures').createObjectId,
  users = {
    user1: {
      _id: id(),
      name: 'Chris'
    }
  };

module.exports.user = users; //Note that users is assigned to user (singular) to match the mongo collection name


