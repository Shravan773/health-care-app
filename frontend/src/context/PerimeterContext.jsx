import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { GET_PERIMETER } from '../api/client';

const PerimeterContext = createContext();

export const PerimeterProvider = ({ children }) => {
  const [perimeter, setPerimeter] = useState(null);
  const perimeterRef = useRef(null);

  const { data, loading, error, refetch } = useQuery(GET_PERIMETER, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
    pollInterval: 5000,
    skip: true, // Initially skip polling
    onCompleted: (data) => {
      if (data?.getPerimeter) {
        const newPerimeter = {
          center: {
            lat: Number(data.getPerimeter.centerLatitude),
            lng: Number(data.getPerimeter.centerLongitude)
          },
          radius: Number(data.getPerimeter.radiusKm) * 1000
        };

        const perimeterChanged =
          !perimeterRef.current ||
          perimeterRef.current.radius !== newPerimeter.radius ||
          perimeterRef.current.center.lat !== newPerimeter.center.lat ||
          perimeterRef.current.center.lng !== newPerimeter.center.lng;

        if (perimeterChanged) {
          setPerimeter(newPerimeter);
          perimeterRef.current = newPerimeter;
        }
      }
    }
  });

  // Start polling only when perimeter changes
  useEffect(() => {
    if (perimeter) {
      refetch({ pollInterval: 5000 });
    }
  }, [perimeter, refetch]);

  const forceRefresh = async () => {
    try {
      const result = await refetch();
      return result;
    } catch (error) {
      console.error('Perimeter refresh failed:', error);
      throw error;
    }
  };

  return (
    <PerimeterContext.Provider value={{ 
      perimeter, 
      loading, 
      error,
      refreshPerimeter: forceRefresh
    }}>
      {children}
    </PerimeterContext.Provider>
  );
};

export const usePerimeter = () => useContext(PerimeterContext);
