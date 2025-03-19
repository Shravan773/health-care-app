const prisma = require('../db');
const { getDistance, isPointWithinRadius } = require('geolib');

// Add utility function for date formatting
const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

const calculateAverageHours = (records) => {
  if (!records.length) return 0;
  
  const totalHours = records.reduce((sum, record) => {
    const clockOut = record.clockOutTime ? new Date(record.clockOutTime) : new Date();
    const clockIn = new Date(record.clockInTime);
    const hours = (clockOut - clockIn) / (1000 * 60 * 60); // Convert ms to hours
    return sum + hours;
  }, 0);

  return parseFloat((totalHours / records.length).toFixed(2));
};

// Add utility function for calculating daily averages
const calculateDailyStats = (records) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dailyHours = {};

  // Initialize daily stats
  days.forEach(day => {
    dailyHours[day] = { totalHours: 0, count: 0 };
  });

  // Calculate total hours for each day
  records.forEach(record => {
    const clockIn = new Date(record.clockInTime);
    const clockOut = record.clockOutTime ? new Date(record.clockOutTime) : new Date();
    const day = days[clockIn.getDay()];
    const hours = (clockOut - clockIn) / (1000 * 60 * 60);
    
    dailyHours[day].totalHours += hours;
    dailyHours[day].count += 1;
  });

  // Calculate averages and format response
  return days
    .filter(day => day !== 'Sunday') // Exclude Sunday
    .map(day => ({
      day,
      avgHours: dailyHours[day].count > 0 
        ? parseFloat((dailyHours[day].totalHours / dailyHours[day].count).toFixed(2))
        : 0
    }));
};

// Add error handling wrapper
const withCorsError = (resolver) => async (parent, args, context, info) => {
  try {
    return await resolver(parent, args, context, info);
  } catch (error) {
    console.error('GraphQL Error:', error);
    // Ensure CORS headers are present in error responses
    throw new Error(error.message);
  }
};

const resolvers = {
  Query: {
    getCurrentUser: withCorsError(async (_, __, { user, prisma }) => {
      if (!user) throw new Error('Not authenticated');
      return prisma.user.findUnique({
        where: { email: user.email }
      });
    }),

    getClockStatus: async (_, { userId }, { prisma }) => {
      return prisma.clockRecord.findFirst({
        where: {
          userId,
          clockOutTime: null
        },
        orderBy: { clockInTime: 'desc' }
      });
    },

    getClockRecords: async (_, { userId, startDate, endDate }) => {
      const records = await prisma.clockRecord.findMany({
        where: {
          ...(userId && { userId }),
          ...(startDate && endDate && {
            clockInTime: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          })
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          clockInTime: 'desc'
        }
      });

      return records.map(record => ({
        ...record,
        status: record.clockOutTime ? 'Clocked Out' : 'Active',
        clockInTime: formatDate(record.clockInTime),
        clockOutTime: formatDate(record.clockOutTime),
        lastClockIn: formatDate(record.clockInTime),
        createdAt: formatDate(record.createdAt),
        updatedAt: formatDate(record.updatedAt),
        location: record.clockInLocation,
        notes: record.clockInNote
      }));
    },

    getPerimeter: async (_, __, { user }) => {
      try {
        const perimeter = await prisma.perimeter.findFirst({
          orderBy: {
            updatedAt: 'desc'
          }
        });
        
        if (!perimeter) {
          return {
            id: 'default',
            centerLatitude: 0,
            centerLongitude: 0,
            radiusKm: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }

        return {
          ...perimeter,
          createdAt: perimeter.createdAt.toISOString(),
          updatedAt: perimeter.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Error in getPerimeter:', error);
        throw new Error('Failed to fetch perimeter');
      }
    },

    getActiveStaff: async () => {
      const activeRecords = await prisma.clockRecord.findMany({
        where: { clockOutTime: null },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          clockInTime: 'desc'
        }
      });

      return activeRecords.map(record => ({
        id: record.user.id,
        name: record.user.name,
        email: record.user.email,
        role: record.user.role,
        status: 'Active',
        lastClockIn: formatDate(record.clockInTime),
        location: record.clockInLocation,
        notes: record.clockInNote
      }));
    },

    getDashboardStats: async (_, __, { user, prisma }) => {
      if (!user || user.role !== 'MANAGER') {
        throw new Error('Unauthorized');
      }
    
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
    
      // Get total staff count (unchanged)
      const totalStaff = await prisma.user.count({ 
        where: { role: 'CARE_WORKER' } 
      });
    
      // Get unique active staff count
      const activeStaffRecords = await prisma.clockRecord.findMany({
        where: { 
          clockOutTime: null // Only get records without clock out
        },
        select: {
          userId: true
        },
        distinct: ['userId'] // Get unique users only
      });
    
      // Get today's records
      const todayRecords = await prisma.clockRecord.findMany({
        where: { 
          clockInTime: { gte: today }
        },
        include: {
          user: {
            select: { name: true }
          }
        }
      });
    
      // Get completed shifts for weekly stats
      const weeklyRecords = await prisma.clockRecord.findMany({
        where: { 
          clockInTime: { gte: startOfWeek },
          NOT: { clockOutTime: null }
        },
        include: {
          user: {
            select: { name: true }
          }
        }
      });
    
      // Calculate weekly hours by staff
      const staffHours = weeklyRecords.reduce((acc, record) => {
        const staffName = record.user.name;
        const clockOut = record.clockOutTime || new Date();
        const clockIn = new Date(record.clockInTime);
        const hours = (clockOut - clockIn) / (1000 * 60 * 60);
        acc[staffName] = (acc[staffName] || 0) + hours;
        return acc;
      }, {});
    
      const avgHoursToday = calculateAverageHours(todayRecords);
    
      // Count unique clock-ins for today
      const uniqueClockInsToday = new Set(todayRecords.map(record => record.userId)).size;
    
      return {
        totalStaffCount: totalStaff,
        activeStaffCount: activeStaffRecords.length, // Use unique active staff count
        clockInsToday: uniqueClockInsToday, // Use unique clock-ins count
        averageHoursToday: avgHoursToday,
        dailyStats: calculateDailyStats(weeklyRecords),
        weeklyHoursByStaff: Object.entries(staffHours).map(([staffName, totalHours]) => ({
          staffName,
          totalHours: parseFloat(totalHours.toFixed(2))
        }))
      };
    },

    staffOverview: async (_, __, { prisma }) => {
      const users = await prisma.user.findMany({
        where: { 
          role: 'CARE_WORKER',
          clockRecords: {
            some: {} // Only include users with at least one clock record
          }
        },
        include: {
          clockRecords: {
            orderBy: { clockInTime: 'desc' },
            take: 1, // Get only the latest clock record
          },
        },
      });
    
      return users.map(user => {
        const lastRecord = user.clockRecords?.[0];
        const isActive = lastRecord && !lastRecord.clockOutTime;
    
        return {
          id: user.id,
          name: user.name,
          status: isActive ? 'Active' : 'Not Active',
          isClockIn: isActive,
          lastClockIn: formatDate(lastRecord?.clockInTime),
          lastClockOut: formatDate(lastRecord?.clockOutTime),
          location: lastRecord
            ? (lastRecord.clockOutTime ? lastRecord.clockOutLocation : lastRecord.clockInLocation)
            : null,
          notes: lastRecord
            ? (lastRecord.clockOutTime ? lastRecord.clockOutNote : lastRecord.clockInNote)
            : null,
        };
      });
    }
  },

  Mutation: {
    clockIn: async (_, { location, note }, { user, prisma }) => {
      try {
        const email = user.email || 'unknown@example.com';
        const name = user.name || email.split('@')[0];
        const authId = user.id || null;

        let dbUser = await prisma.user.findUnique({
          where: {
            authId: authId || undefined,
            email: authId ? undefined : email
          }
        });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email,
              name,
              role: 'CARE_WORKER',
              authId: authId || undefined
            }
          });
        } else if (dbUser.name === 'unknown' || !dbUser.name) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { name }
          });
        }

        const clockRecord = await prisma.clockRecord.create({
          data: {
            userId: dbUser.id,
            clockInTime: new Date(),
            clockInLocation: location,
            clockInNote: note
          },
          include: {
            user: true
          }
        });

        return {
          ...clockRecord,
          status: 'Active',
          clockInTime: formatDate(clockRecord.clockInTime),
          createdAt: formatDate(clockRecord.createdAt),
          updatedAt: formatDate(clockRecord.updatedAt),
          isClockIn: true
        };
      } catch (error) {
        console.error('Error in clockIn:', error);
        throw new Error('Failed to clock in');
      }
    },

    clockOut: async (_, { location, note }, { user, prisma }) => {
      try {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: user.email },
              { authId: user.id }
            ]
          }
        });

        if (!dbUser) {
          throw new Error('User not found');
        }

        const activeRecord = await prisma.clockRecord.findFirst({
          where: {
            userId: dbUser.id,
            clockOutTime: null
          },
          orderBy: {
            clockInTime: 'desc'
          }
        });

        if (!activeRecord) {
          throw new Error('No active clock-in record found');
        }

        const updatedRecord = await prisma.clockRecord.update({
          where: { id: activeRecord.id },
          data: {
            clockOutTime: new Date(),
            clockOutLocation: location,
            clockOutNote: note
          }
        });

        return {
          ...updatedRecord,
          status: 'Clocked Out',
          clockInTime: formatDate(updatedRecord.clockInTime),
          clockOutTime: formatDate(updatedRecord.clockOutTime),
          createdAt: formatDate(updatedRecord.createdAt),
          updatedAt: formatDate(updatedRecord.updatedAt),
          isClockIn: false,
          location: updatedRecord.clockOutLocation,
          notes: updatedRecord.clockOutNote
        };
      } catch (error) {
        console.error('Clock out error:', error);
        throw error;
      }
    },

    updatePerimeter: async (_, { center, radius }, { user, prisma }) => {
      try {
        if (!center || typeof radius !== 'number') {
          throw new Error('Invalid input: center and radius are required');
        }

        const existingPerimeter = await prisma.perimeter.findFirst();
        let updatedPerimeter;

        if (existingPerimeter) {
          updatedPerimeter = await prisma.perimeter.update({
            where: { id: existingPerimeter.id },
            data: {
              centerLatitude: center.latitude,
              centerLongitude: center.longitude,
              radiusKm: radius
            }
          });
        } else {
          updatedPerimeter = await prisma.perimeter.create({
            data: {
              centerLatitude: center.latitude,
              centerLongitude: center.longitude,
              radiusKm: radius
            }
          });
        }

        return {
          success: true,
          message: 'Perimeter updated successfully',
          perimeter: {
            ...updatedPerimeter,
            createdAt: formatDate(updatedPerimeter.createdAt),
            updatedAt: formatDate(updatedPerimeter.updatedAt)
          }
        };
      } catch (error) {
        console.error('UpdatePerimeter error:', error);
        return {
          success: false,
          message: error.message,
          perimeter: null
        };
      }
    }
  }
};

module.exports = resolvers;
