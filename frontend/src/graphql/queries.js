import { gql } from '@apollo/client';

export const DASHBOARD_STATS = gql`
  query DashboardStats {
    dashboardStats {
      avgHoursPerDay
      dailyClockIns
      weeklyHoursByStaff {
        staffName
        totalHours
      }
    }
  }
`;

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    getDashboardStats {
      totalStaffCount
      activeStaffCount
      averageHoursToday
      clockInsToday
      dailyStats {
        day
        avgHours
      }
      weeklyHoursByStaff { # Ensure this field is included
        staffName
        totalHours
      }
    }
  }
`;

export const STAFF_CLOCK_DETAILS = gql`
  query StaffOverview {
    staffOverview {
      id
      name
      status
      isClockIn
      lastClockIn
      lastClockOut
      location {
        latitude
        longitude
      }
      notes
    }
  }
`;