import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { gql } from '@apollo/client';
import { getDistance } from 'geolib';

export const setAuth0Token = (token) => {
  localStorage.setItem('auth_token', token); // Store the token in localStorage
};

export const queryConfigs = {
  perimeter: {
    fetchPolicy: 'network-only',
    pollInterval: 30000
  },
  staff: {
    fetchPolicy: 'network-only',
    pollInterval: 4000 // Reduced polling interval to 4 seconds
  },
  default: {
    fetchPolicy: 'network-only'
  }
};

export const getAuthHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

export const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URI, // Use the environment variable instead of '/graphql'
  credentials: 'include',
  fetchOptions: {
    mode: 'cors',
  }
});

export const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('auth_token'); // Retrieve the token from localStorage
  const role = localStorage.getItem('user_role');
  const email = localStorage.getItem('user_email');
  const name = localStorage.getItem('user_name');
  const id = localStorage.getItem('user_id');

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : '',
      'X-User-Role': role || '',
      'X-User-Email': email || '',
      'X-User-Name': name || '',
      'X-User-Id': id || '',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
  }));

  return forward(operation);
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'network-only' },
    query: { fetchPolicy: 'network-only' },
  }
});

export const CLOCK_RECORDS = gql`
  query GetClockRecords($userId: ID!) {
    clockRecords(userId: $userId) {
      id
      type
      timestamp
      location {
        lat
        lng
      }
      note
    }
  }
`;

export const STAFF_OVERVIEW = gql`
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

export const GET_PERIMETER = gql`
  query GetPerimeter {
    getPerimeter {
      id
      centerLatitude
      centerLongitude
      radiusKm
      createdAt
      updatedAt
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
      weeklyHoursByStaff {
        staffName
        totalHours
      }
    }
  }
`;

export const CLOCK_IN = gql`
  mutation ClockIn($location: LocationInput!, $note: String) {
    clockIn(location: $location, note: $note) {
      id
      status
      clockInTime
      clockInLocation {
        latitude
        longitude
      }
      clockInNote
      createdAt
      updatedAt
      isClockIn
      userId
      user {
        name
      }
    }
  }
`;

export const CLOCK_OUT = gql`
  mutation ClockOut($location: LocationInput!, $note: String) {
    clockOut(location: $location, note: $note) {
      id
      status
      clockOutTime
      clockOutLocation {
        latitude
        longitude
      }
      clockOutNote
    }
  }
`;

export const updatePerimeterVariables = (latitude, longitude, radius) => ({
  variables: {
    center: {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    },
    radius: parseFloat(radius)
  }
});

export const UPDATE_PERIMETER = gql`
  mutation UpdatePerimeter($center: CenterInput!, $radius: Float!) {
    updatePerimeter(center: $center, radius: $radius) {
      success
      message
      perimeter {
        id
        centerLatitude
        centerLongitude
        radiusKm
        createdAt
        updatedAt
      }
    }
  }
`;

export const usePerimeterData = (client) => {
  return client.query({
    query: GET_PERIMETER,
    pollInterval: 15000,
    fetchPolicy: 'network-only'
  });
};

export const calculateDistance = (point1, point2) => {
  if (!point1 || !point2 || !point1.lat || !point1.lng || !point2.lat || !point2.lng) {
    return Infinity; // Return Infinity to fail the perimeter check
  }
  return getDistance(
    { latitude: Number(point1.lat), longitude: Number(point1.lng) },
    { latitude: Number(point2.lat), longitude: Number(point2.lng) }
  );
};

export const isWithinPerimeter = (point, center, radius) => {
  const validPoint = {
    lat: Number(point?.lat),
    lng: Number(point?.lng)
  };
  const validCenter = {
    lat: Number(center?.lat),
    lng: Number(center?.lng)
  };
  const validRadius = Number(radius);
  if (isNaN(validPoint.lat) || isNaN(validPoint.lng) || 
      isNaN(validCenter.lat) || isNaN(validCenter.lng) || 
      isNaN(validRadius) || validRadius <= 0) {
    return false;
  }
  const distance = calculateDistance(validPoint, validCenter);
  return distance <= validRadius;
};