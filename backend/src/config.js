module.exports = {
  auth0: {
    domain: process.env.AUTH0_DOMAIN,
    audience: process.env.AUTH0_AUDIENCE,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    namespace: 'https://healthcare-clock-app.com/'  // Make sure this matches Auth0 setup
  }
};
