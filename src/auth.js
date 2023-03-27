const auth = require('basic-auth');

// Adding Basic Auth Middleware for the Service

function authenticate(req, res, next) {
  const user = auth(req);

// When deploying in an environment we will parameterize those there.
const USER = 'admin';
const PASS = 'password';

  if (!user || !user.name || !user.pass) {
    res.set('WWW-Authenticate', 'Basic realm="Authorization Required"');
    return res.status(401).send();
  }

  if (user.name === USER && user.pass === PASS) {
    return next();
  } else {
    res.set('WWW-Authenticate', 'Basic realm="Authorization Required"');
    return res.status(401).send();
  }
}

module.exports = { authenticate }