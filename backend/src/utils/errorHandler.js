const { GraphQLError } = require('graphql');

const ErrorTypes = {
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERIMETER_ERROR: 'PERIMETER_ERROR'
};

function formatError(error) {
  if (error.originalError instanceof GraphQLError) {
    return error;
  }

  console.error('GraphQL Error:', error);

  return new GraphQLError(
    error.message,
    {
      extensions: {
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        path: error.path
      }
    }
  );
}

module.exports = {
  ErrorTypes,
  formatError
};
