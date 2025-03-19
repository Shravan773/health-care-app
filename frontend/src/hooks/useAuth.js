import { useCallback } from 'react';
import { getRoleFromToken } from '../api/client';
import { useAuth0 } from '@auth0/auth0-react';

export const useRoleAuth = () => {
  const { getAccessTokenSilently } = useAuth0();

  const checkPermission = useCallback(async (requiredRole) => {
    try {
      const token = await getAccessTokenSilently();
      const userRole = getRoleFromToken(token);
      return userRole === requiredRole;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }, [getAccessTokenSilently]);

  return { checkPermission };
};
