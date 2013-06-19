/**
* Allow any authenticated user.
*/

function paramNormalizer (url, id) {
  var params = url.split('/');
  if (params[0] === '') {
    params.shift();
  }
  if (params[params.length - 1] === '') {
    params.pop();
  }
  if (params.length < 3) {
    params.push(id);
  }
  return '/' + params.join('/');
}

module.exports = function (req, res, next) {
	// User is allowed, proceed to controller
  if (req.user && req.user.clientID !== 'quiver') {

    req.url = paramNormalizer(req.url, req.user.clientID);
    req.query.id = req.user.clientID; //Force all user queries to have an id query param that matches the user's id.
    if (req.method !== 'PUT') {
      return res.send("You are not permitted to perform this action.", 403);
    }
  }
  return next();
};