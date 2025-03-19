const jwt = require('jsonwebtoken');
const prisma = require('./db');

// Use the same secret key across the application
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function createUsers() {
  try {
    // Create manager if not exists
    const manager = await prisma.user.upsert({
      where: { email: 'manager@example.com' },
      update: {},
      create: {
        email: 'manager@example.com',
        name: 'Manager User',
        role: 'MANAGER',
      },
    });

    // Create care worker if not exists
    const careWorker = await prisma.user.upsert({
      where: { email: 'careworker@example.com' },
      update: {},
      create: {
        email: 'careworker@example.com',
        name: 'Care Worker',
        role: 'CARE_WORKER',
      },
    });

    console.log('Users created:', { manager, careWorker });

    // Generate tokens using the consistent secret
    const managerToken = jwt.sign(
      { id: manager.id, email: manager.email, name: manager.name, role: manager.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const workerToken = jwt.sign(
      { id: careWorker.id, email: careWorker.email, name: careWorker.name, role: careWorker.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('Manager Token:', managerToken);
    console.log('Care Worker Token:', workerToken);
  } catch (error) {
    console.error('Error creating users:', error);
  }
}

createUsers();