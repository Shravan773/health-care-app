import React, { useEffect, useState } from 'react';
import { Layout, Card, Timeline, message, Button } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { isWithinPerimeter } from '../api/client';
import LocationMap from '../components/LocationMap';
import { usePerimeter } from '../context/PerimeterContext';
import PWAInstallButton from '../components/PWAInstallButton';

const CareworkerDashboard = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const { history, setHistory, isClockIn, setIsClockIn, clockIn, clockOut, user, isLoading } = useAuth();
  const { perimeter, refreshPerimeter } = usePerimeter();

  // Refresh perimeter data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPerimeter();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [refreshPerimeter]);

  // Handle location monitoring
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);

        if (perimeter?.center && perimeter?.radius) {
          const withinRange = isWithinPerimeter(location, perimeter.center, perimeter.radius);
          setIsWithinRange(withinRange);
        }
      },
      (error) => {
        console.error('Location error:', error);
        message.error('Unable to get location. Please enable location services.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [perimeter]);

  // Add perimeter change effect
  useEffect(() => {
    if (perimeter) {
      // Force location check when perimeter updates
      if (currentLocation) {
        const withinRange = isWithinPerimeter(currentLocation, perimeter.center, perimeter.radius);
        if (withinRange !== isWithinRange) {
          setIsWithinRange(withinRange);
        }
      }
    }
  }, [perimeter, currentLocation]);

  const handleClockInOut = async () => {
    try {
      if (!currentLocation) {
        message.error('Unable to get your current location. Please try again.');
        return;
      }

      const { lat, lng } = currentLocation;

      // Check if trying to clock in
      if (!isClockIn) {
        if (!perimeter?.center) {
          message.error('Waiting for perimeter data. Please try again.');
          return;
        }

        // Using isWithinRange state instead of recalculating
        if (!isWithinRange) {
          message.error('You must be within the work area to clock in.');
          return;
        }

        const response = await clockIn({
          latitude: lat,
          longitude: lng,
          note: 'Clocked in successfully',
        });
        message.success('Clocked in successfully!');
        setIsClockIn(true);

        setHistory((prevHistory) => [
          ...prevHistory,
          {
            type: 'in',
            timestamp: response.clockInTime || new Date().toISOString(),
            note: response.clockInNote || 'Clocked in successfully',
          },
        ]);
      } else {
        // Clock Out - no perimeter check needed
        const response = await clockOut({
          latitude: lat,
          longitude: lng,
          note: 'Clocked out successfully',
        });
        message.success('Clocked out successfully!');
        setIsClockIn(false);

        setHistory((prevHistory) => [
          ...prevHistory,
          {
            type: 'out',
            timestamp: response.clockOutTime || new Date().toISOString(),
            note: response.clockOutNote || 'Clocked out successfully',
          },
        ]);
      }
    } catch (error) {
      console.error('Clock In/Out Error:', {
        error,
        currentLocation,
        perimeter,
        isWithinRange
      });
      message.error('Failed to clock in/out. Please try again.');
    }
  };

  const { Content } = Layout;

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  if (!user) {
    console.error('No user data available');
    return <div>Error: Unable to load user data</div>;
  }

  // Convert timeline items to the new format
  const timelineItems = history.slice(-10).reverse().map((record, index) => ({
    key: index,
    color: record.type === 'in' ? 'green' : 'red',
    dot: <ClockCircleOutlined />,
    children: (
      <>
        <p>{record.type === 'in' ? 'Clocked In' : 'Clocked Out'}</p>
        <p>{record.timestamp ? new Date(record.timestamp).toLocaleString() : 'Time not available'}</p>
        {record.note && <p>Note: {record.note}</p>}
      </>
    )
  }));

  return (
    <Layout>
      <Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        <PWAInstallButton />
        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <Card title="Clock Controls">
            <Button
              type="primary"
              danger={isClockIn} // Red color for "Clock Out"
              onClick={handleClockInOut}
              block
            >
              {isClockIn ? 'Clock Out' : 'Clock In'}
            </Button>
          </Card>

          <Card title="Location Status">
            <LocationMap />
          </Card>

          <Card title="Recent Activity" style={{ gridColumn: '1 / -1' }}>
            {history && history.length > 0 ? (
              <Timeline
                mode="left"
                items={timelineItems}
              />
            ) : (
              <div>No recent activity</div>
            )}
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default CareworkerDashboard;
