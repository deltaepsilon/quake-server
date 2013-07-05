module.exports = {
  resolver: function (deferred) {
    return {
      done: function (err, res) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(res);
        }
      },
      resolve: function (res) {
        deferred.resolve(res);
      },
      reject: function (err) {
        deferred.reject(err);
      }
    } ;
  },
  handler: function (res) {
    var success = function (response) {
        res.send(JSON.stringify(response));
      },
      error = function (err) {
        res.error(err.message || err);
      };
    return {
      success: success,
      error: error
    }
  }
}
