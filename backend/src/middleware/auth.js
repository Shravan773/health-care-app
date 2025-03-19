const prisma = require('../db');
const config = require('../config');

const authMiddleware = async (req, res, next) => {
  try {
    // Log all headers received in the backend

    // Extract headers with case-insensitive access
    const userRole = req.headers['x-user-role'] || req.headers['X-User-Role'];
    const userEmail = req.headers['x-user-email'] || req.headers['X-User-Email'];
    const userName = req.headers['x-user-name'] || req.headers['X-User-Name'];
    const userId = req.headers['x-user-id'] || req.headers['X-User-Id']; // Ensure userId is extracted
    const userMetadata = req.headers['x-user-metadata'] || req.headers['X-User-Metadata'];

    // Log extracted user details
    console.log('Extracted user details:', {
      role: userRole,
      email: userEmail,
      name: userName,
      id: userId,
      metadata: userMetadata,
      timestamp: new Date().toISOString()
    });

    // Validate role presence
    if (!userRole) {
      console.warn('No role provided in headers');
      return res.status(401).json({ error: 'No role provided' });
    }

    // Parse metadata if available
    const metadata = userMetadata ? JSON.parse(userMetadata) : {};

    // Set user object in request
    req.user = {
      role: userRole.toUpperCase(),
      email: userEmail || 'unknown@example.com',
      name: userName || 'Unknown User',
      id: userId || null, // Ensure id is set to null if missing
      metadata,
      permissions: userRole.toUpperCase() === 'MANAGER'
        ? ['create:clock-records', 'read:clock-records', 'manage:staff']
        : ['create:clock-records', 'read:clock-records']
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = authMiddleware; // Fix: Export the middleware correctly
