const prisma = require('./db');

async function clearRecords() {
  try {
    // Delete all clock records
    await prisma.clockRecord.deleteMany({});
    console.log('All clock records cleared.');

    // Reset users to default manager and care worker
    await prisma.user.deleteMany({});
    console.log('All users cleared.');

    // Recreate default users
    const manager = await prisma.user.create({
      data: {
        email: 'manager@example.com',
        name: 'Manager User',
        role: 'MANAGER',
      },
    });

    const careWorker = await prisma.user.create({
      data: {
        email: 'careworker@example.com',
        name: 'Care Worker',
        role: 'CARE_WORKER',
      },
    });

    console.log('Default users recreated:', { manager, careWorker });
  } catch (error) {
    console.error('Error clearing records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearRecords();
