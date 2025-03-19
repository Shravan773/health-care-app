import React, { useState, useEffect } from 'react';
import { Button, Tooltip, message } from 'antd';
import { useAuth } from '../context/AuthContext';
import { useMutation } from '@apollo/client';
import { CLOCK_IN, CLOCK_OUT, isWithinPerimeter } from '../api/client';

const ClockButton = () => {
  const { isClockIn, setIsClockIn, perimeter, token, setHistory } = useAuth(); // Ensure setIsClockIn is accessed
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWithinRange, setIsWithinRange] = useState(false);

  const [clockInMutation] = useMutation(CLOCK_IN);
  const [clockOutMutation] = useMutation(CLOCK_OUT);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude),
        };
        setCurrentLocation(location);

        if (perimeter?.center && perimeter?.radius) {
          const withinPerimeter = isWithinPerimeter(location, perimeter.center, perimeter.radius);
          setIsWithinRange(withinPerimeter);
        }
      },
      (error) => {
        console.error('Location error:', error);
        message.error('Unable to get location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [perimeter]);

  const handleClick = async () => {
    if (!currentLocation) {
      message.error('Location not available');
      return;
    }

    setIsLoading(true);
    try {
      if (isClockIn) {
        const { data } = await clockOutMutation({
          variables: {
            location: {
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
            },
            note: 'Clock out from web app',
          },
          context: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          refetchQueries: ['StaffOverview'],
        });

        if (data?.clockOut?.status) {
          setIsClockIn(false);
          setHistory((prev) => [
            ...prev,
            {
              type: 'out',
              timestamp: data.clockOut.clockOutTime,
              location: data.clockOut.clockOutLocation,
              note: 'Clock out from web app',
            },
          ]);
          message.success('Successfully clocked out');
        }
      } else {
        if (!isWithinRange) {
          message.error('You must be within the designated area to clock in');
          return;
        }

        const { data } = await clockInMutation({
          variables: {
            location: {
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
            },
            note: 'Clock in from web app',
          },
          context: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });

        if (data?.clockIn?.status === 'Active') {
          setIsClockIn(true);
          setHistory((prev) => [
            ...prev,
            {
              type: 'in',
              timestamp: data.clockIn.clockInTime,
              location: data.clockIn.clockInLocation,
              note: 'Clock in from web app',
            },
          ]);
          message.success('Successfully clocked in');
        }
      }
    } catch (error) {
      console.error('Clock action failed:', error);
      message.error(error.message || 'Failed to process clock action');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonTooltip = () => {
    if (!currentLocation) return 'Waiting for location...';
    if (!isClockIn && !isWithinRange) return 'You must be within the designated area to clock in';
    return '';
  };

  return (
    <Tooltip title={getButtonTooltip()}>
      <Button
        type="primary"
        onClick={handleClick}
        loading={isLoading}
        disabled={!currentLocation || (!isClockIn && !isWithinRange)}
        danger={isClockIn}
        block
      >
        {isClockIn ? 'Clock Out' : 'Clock In'}
      </Button>
    </Tooltip>
  );
};

export default ClockButton;
