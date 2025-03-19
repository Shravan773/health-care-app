require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const http = require('http');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('./middleware/auth');
const config = require('./config');

const app = express();
const httpServer = http.createServer(app);
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://192.168.109.24:3000',
    'http://192.168.109.24:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  allowedHeaders: [
    'Authorization',
    'Content-Type',
    'X-User-Role',
    'X-User-Email',
    'X-User-Name',
    'X-User-ID',
    'X-User-Metadata',
    'apollo-require-preflight'
  ],
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  exposedHeaders: ['Access-Control-Allow-Origin']
}));

// Apply Auth0 middleware, but exclude public routes
app.use((req, res, next) => {
  if (req.method === 'OPTIONS' || req.path === '/health') {
    return next();
  }
  authMiddleware(req, res, next);
});

// Error handler for authentication errors
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      message: 'Invalid token',
      error: err.message 
    });
  }
  if (err.name === 'TypeError') {
    return res.status(400).json({ 
      message: 'Bad request',
      error: err.message 
    });
  }
  next(err);
});

// Logging middleware
app.use((req, res, next) => {
  if (req.path !== '/graphql' || req.method !== 'POST') {
    console.log(`Incoming request: ${req.method} ${req.url}`);
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({
    user: req.user || {
      role: 'CARE_WORKER',
      permissions: ['create:clock-records', 'read:clock-records']
    },
    prisma
  }),
  formatError: (err) => {
    console.error('GraphQL Error:', {
      message: err.message,
      path: err.path,
      stack: err.extensions?.exception?.stacktrace
    });
    return err;
  },
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer })
  ],
  persistedQueries: false, // Disable persisted queries to avoid memory exhaustion
  introspection: true,
  playground: true,
  cors: false // Let Express handle CORS
});

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('📦 Connected to Neon database');

    await server.start();
    server.applyMiddleware({ app, cors: false });

    const PORT = process.env.PORT || 4000;
    await new Promise((resolve, reject) => {
      httpServer.listen({ port: PORT }, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    return true;
  } catch (error) {
    console.error('Error starting server:', error);
    if (error.message.includes('prisma')) {
      console.error('Database connection failed. Check your DATABASE_URL');
    }
    throw error;
  }
}

// Graceful shutdown for Prisma
async function shutdown() {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  console.log('Prisma disconnected. Server shut down.');
}

// Handle process termination signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server based on environment
if (process.env.NODE_ENV === 'development') {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
} else {
  module.exports = async (req, res) => {
    if (!server.started) {
      await startServer();
      server.started = true;
    }
    return app(req, res);
  };
}

// Suppress deprecation warnings for cleaner output
process.env.NODE_NO_WARNINGS = '1';
