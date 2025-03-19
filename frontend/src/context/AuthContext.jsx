import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { CLOCK_IN, CLOCK_OUT, UPDATE_PERIMETER, GET_PERIMETER, setAuth0Token, authLink, httpLink, STAFF_OVERVIEW } from '../api/client'; // Remove STAFF_CLOCK_DETAILS
import { useMutation, ApolloClient, InMemoryCache } from '@apollo/client';
import { message } from 'antd';  // Add this import

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { 
    isAuthenticated, 
    user, 
    loginWithRedirect, 
    logout,
    getAccessTokenSilently,
    isLoading 
  } = useAuth0();

  const [token, setToken] = useState(null);
  const [apolloClient, setApolloClient] = useState(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isClockIn, setIsClockIn] = useState(false);
  const [perimeter, setPerimeter] = useState(null); // Remove default value
  const [history, setHistory] = useState([]); // Add history state
  const [staff, setStaff] = useState([]); // Initialize staff state
  const [pwaPrompt, setPwaPrompt] = useState(null);

  const [clockInMutation] = useMutation(CLOCK_IN);
  const [clockOutMutation] = useMutation(CLOCK_OUT);
  const [updatePerimeterMutation] = useMutation(UPDATE_PERIMETER);

  // Add new function to update user info in localStorage
  const updateUserInfo = (userData) => {
    const isSignupFlow = localStorage.getItem('auth_signup_flow') === 'true';
    const existingRole = localStorage.getItem('user_role');

    // Never update role unless it's signup flow
    if (!isSignupFlow) {
      return;
    }

    // Only update non-role user info
    localStorage.setItem('user_email', userData.email || '');
    localStorage.setItem('user_name', userData.nickname || userData.name || '');
    localStorage.setItem('user_id', userData.sub || '');
  };

  // Initialize Apollo client after authentication
  useEffect(() => {
    const initializeClient = async () => {
      if (isLoading || !isAuthenticated) return;

      try {
        const accessToken = await getAccessTokenSilently({
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        });
        const userRole = localStorage.getItem('user_role');

        if (!userRole) {
          return;
        }

        setToken(accessToken);
        setAuth0Token(accessToken);

        const client = new ApolloClient({
          link: authLink.concat(httpLink),
          cache: new InMemoryCache(),
          defaultOptions: {
            watchQuery: { fetchPolicy: 'network-only' },
            query: { fetchPolicy: 'network-only' },
          },
          context: {
            headers: {
              'X-User-Role': userRole,
            },
          },
        });

        setApolloClient(client);
      } catch (error) {
        console.error('Token Error:', error);
      }
    };

    initializeClient();
  }, [isAuthenticated, getAccessTokenSilently, isLoading]);

  // Add PWA installation handler
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setPwaPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handlePWAInstall = async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    const result = await pwaPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setPwaPrompt(null);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const isSignupFlow = localStorage.getItem('auth_signup_flow') === 'true';
    const userRole = localStorage.getItem('user_role');
    setShowRoleSelection(isSignupFlow || !userRole);
  }, [isAuthenticated, user]);

  // Update useEffect for authentication
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const storedRole = localStorage.getItem('user_role');
      const isSignupFlow = localStorage.getItem('auth_signup_flow') === 'true';

      if (isSignupFlow || !storedRole) {
        setShowRoleSelection(true);
      }
    }
  }, [isLoading, isAuthenticated, user]);

  // Remove the conflicting useEffect that was updating roles
  useEffect(() => {
    if (isAuthenticated && user) {
      const storedRole = localStorage.getItem('user_role');
    }
  }, [isAuthenticated, user]);

  const login = (options = {}) => {
    if (options.authorizationParams?.screen_hint === 'signup') {
      localStorage.setItem('auth_signup_flow', 'true');
    } else {
      localStorage.removeItem('auth_signup_flow');
    }
    return loginWithRedirect(options);
  };

  // Modify handleRoleSelection
  const handleRoleSelection = async (selectedRole) => {
    try {
      const roleToSet = selectedRole.toUpperCase();

      localStorage.setItem('auth_signup_flow', 'false');
      localStorage.setItem('user_role', roleToSet);
      localStorage.setItem('user_email', user?.email || '');
      localStorage.setItem('user_name', user?.nickname || user?.name || '');
      localStorage.setItem('user_id', user?.sub || '');
      
      setShowRoleSelection(false);

      // Force a hard reload to ensure role takes effect
      window.location.href = roleToSet === 'MANAGER' ? '/manager' : '/careworker';
    } catch (error) {
      console.error('Role selection failed:', error);
      message.error('Failed to set role. Please try again.');
    }
  };

  const updatePerimeter = async ({ center, radius }) => {
    try {
      const response = await updatePerimeterMutation({
        variables: {
          center: {
            latitude: center.lat, // Match the backend schema
            longitude: center.lng,
          },
          radius: radius / 1000, // Convert meters to kilometers
        },
      });

      if (response.data?.updatePerimeter?.success) {
        const updatedPerimeter = response.data.updatePerimeter.perimeter;
        setPerimeter({
          center: {
            lat: Number(updatedPerimeter.centerLatitude),
            lng: Number(updatedPerimeter.centerLongitude),
          },
          radius: Number(updatedPerimeter.radiusKm) * 1000, // Convert km to meters
        });
        return updatedPerimeter;
      } else {
        throw new Error(response.data?.updatePerimeter?.message || 'Failed to update perimeter');
      }
    } catch (error) {
      console.error('Error updating perimeter:', error);
      throw error;
    }
  };

  const fetchStaff = async () => {
    try {
      if (!apolloClient) return;
      const { data } = await apolloClient.query({
        query: STAFF_OVERVIEW
      });
      setStaff(data.staffOverview || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  // Update function to use STAFF_OVERVIEW instead of STAFF_CLOCK_DETAILS
  const checkClockInStatus = async () => {
    try {
      if (!apolloClient) return;
      const { data } = await apolloClient.query({
        query: STAFF_OVERVIEW,
        fetchPolicy: 'network-only'
      });
      const userDetails = data?.staffOverview?.find(
        staff => staff.id === localStorage.getItem('user_id')
      );
      setIsClockIn(userDetails?.isClockIn || false);
    } catch (error) {
      console.error('Error checking clock-in status:', error);
    }
  };

  // Add effect to check clock-in status on mount
  useEffect(() => {
    if (isAuthenticated && apolloClient) {
      checkClockInStatus();
    }
  }, [isAuthenticated, apolloClient]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      token,
      apolloClient,
      login,
      logout: () => logout({ returnTo: window.location.origin }),
      clockIn: async ({ latitude, longitude, note }) => {
        try {
          const response = await clockInMutation({
            variables: {
              location: { latitude, longitude },
              note,
            },
            context: {
              // Ensure headers are included
              headers: {
                'X-User-Role': localStorage.getItem('user_role'),
                'X-User-Email': localStorage.getItem('user_email'),
                'X-User-Name': localStorage.getItem('user_name'),
                'X-User-Id': localStorage.getItem('user_id'),
              }
            }
          });
      
          setIsClockIn(true);
          message.success('Successfully clocked in!');
          return response.data;
        } catch (error) {
          console.error('Clock In Error:', {
            error,
            userInfo: {
              id: localStorage.getItem('user_id'),
              role: localStorage.getItem('user_role')
            },
            timestamp: new Date().toISOString()
          });
          message.error('Failed to clock in: ' + error.message);
          throw error;
        }
      },
      clockOut: async ({ latitude, longitude, note }) => {
        try {
          if (!isClockIn) {
            message.error('You must clock in before you can clock out');
            return;
          }

          const response = await clockOutMutation({
            variables: {
              location: { latitude, longitude }, // Send location as an object
              note,
            },
          });
          setIsClockIn(false);
          message.success('Successfully clocked out!');
          return response.data;
        } catch (error) {
          console.error('Clock Out Error:', {
            error,
            isClockIn,
            userId: localStorage.getItem('user_id'),
            timestamp: new Date().toISOString()
          });
          if (error.message.includes('No active clock-in')) {
            message.error('You must clock in before you can clock out');
          } else {
            message.error('Failed to clock out: ' + error.message);
          }
          throw error;
        }
      },
      updatePerimeter, // Add this
      perimeter,
      setPerimeter,
      isClockIn,
      setIsClockIn,
      showRoleSelection,
      handleRoleSelection,
      history, // Provide history
      setHistory, // Provide setHistory
      staff,
      fetchStaff,
      pwaPrompt,
      setPwaPrompt,
      handlePWAInstall,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
