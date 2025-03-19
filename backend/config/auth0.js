const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE, // Ensure this matches the frontend audience
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'], // Ensure RS256 is used
});

// Middleware to extract role and permissions
const extractUserInfo = (req, res, next) => {
  if (req.user) {
    req.user.role = req.user['https://my-app.com/role'];
    req.user.username = req.user['https://my-app.com/username']; // Extract username
    console.log('Extracted User Info:', {
      role: req.user.role,
      username: req.user.username, // Log the username
      permissions: req.user.permissions,
    });
  }
  next();
};

module.exports = { checkJwt, extractUserInfo };
