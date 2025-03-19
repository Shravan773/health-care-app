const prisma = require('./db');

async function createUser() {
  try {
    // Create manager
    const manager = await prisma.user.upsert({
      where: { email: 'manager@example.com' },
      update: {},
      create: {
        email: 'manager@example.com',
        name: 'Manager User',
        role: 'MANAGER',
      },
    });

    // Create careworker
    const careworker = await prisma.user.upsert({
      where: { email: 'careworker@example.com' },
      update: {},
      create: {
        email: 'careworker@example.com',
        name: 'Care Worker',
        role: 'CARE_WORKER',
      },
    });

    console.log('Users created:', {
      manager,
      careworker
    });

  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
