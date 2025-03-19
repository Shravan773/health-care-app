const { gql } = require('apollo-server-express');

const typeDefs = gql`
  enum Role {
    MANAGER
    CARE_WORKER
  }

  type Location {
    latitude: Float!
    longitude: Float!
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: Role!
    createdAt: String!
    updatedAt: String!
  }

  type ClockRecord {
    id: ID!
    user: User!
    userId: ID!
    clockInTime: String!
    clockOutTime: String
    clockInLocation: Location!
    clockOutLocation: Location
    clockInNote: String
    clockOutNote: String
    status: String!
    lastClockIn: String!
    location: Location!
    notes: String
    createdAt: String!
    updatedAt: String!
    isClockIn: Boolean!
  }

  type Perimeter {
    id: ID!
    centerLatitude: Float!
    centerLongitude: Float!
    radiusKm: Float!
    createdAt: String!
    updatedAt: String!
  }

  type StaffOverview {
    id: ID!
    name: String!
    status: String!
    isClockIn: Boolean # Make isClockIn nullable
    lastClockIn: String
    lastClockOut: String
    location: Location
    notes: String
  }

  type StaffHours {
    staffName: String!
    totalHours: Float!
  }

  type DailyStat {
    day: String!
    avgHours: Float!
  }

  type StaffWeeklyHours {
    staffName: String!
    totalHours: Float!
  }

  type DashboardStats {
    totalStaffCount: Int!
    activeStaffCount: Int!
    averageHoursToday: Float!
    clockInsToday: Int!
    avgHoursPerDay: Float!
    dailyClockIns: Int!
    weeklyHoursByStaff: [StaffWeeklyHours!]!
    dailyStats: [DailyStat!]!
  }

  input LocationInput {
    latitude: Float!
    longitude: Float!
  }

  input CenterInput {
    latitude: Float!
    longitude: Float!
  }

  type PerimeterResponse {
    success: Boolean!
    message: String!
    perimeter: Perimeter
  }

  type Query {
    getCurrentUser: User
    getClockStatus(userId: ID!): ClockRecord
    getClockRecords(userId: ID, startDate: String, endDate: String): [ClockRecord!]!
    getPerimeter: Perimeter!
    getActiveStaff: [StaffOverview!]!
    getDashboardStats: DashboardStats!
    staffOverview: [StaffOverview!]!
  }

  type Mutation {
    clockIn(location: LocationInput!, note: String): ClockRecord!
    clockOut(location: LocationInput!, note: String): ClockRecord!
    updatePerimeter(center: CenterInput!, radius: Float!): PerimeterResponse!
  }
`;

module.exports = typeDefs;
