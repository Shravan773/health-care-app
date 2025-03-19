import { Card, Alert, Space, Typography } from 'antd';
import { usePerimeter } from '../context/PerimeterContext';
import { useState, useEffect } from 'react';
import { EnvironmentOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Text } = Typography;

const MapContainer = styled.div`
  height: 400px;
  width: 100%;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  position: relative;
  background: #fafafa;
  overflow: hidden;
`;

const LocationIndicator = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`;

const PerimeterCircle = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid #1890ff;
  border-radius: 50%;
  opacity: 0.2;
  background-color: #1890ff;
  width: 200px;
  height: 200px;
`;

const LocationMap = () => {
  const { perimeter, loading } = usePerimeter();
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          // Error handling
        }
      );
    }
  }, []);

  if (loading) {
    return <Card loading={true} />;
  }

  return (
    <Card title="Location Status">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          message={perimeter ? "Work Perimeter Set" : "No Perimeter Set"}
          type={perimeter ? "success" : "warning"}
          showIcon
        />
        
        <MapContainer>
          <PerimeterCircle />
          <LocationIndicator>
            <EnvironmentOutlined style={{ fontSize: '24px', color: '#f5222d' }} />
            <Text>Current Location</Text>
            {currentLocation && (
              <Text type="secondary">
                ({currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)})
              </Text>
            )}
          </LocationIndicator>
        </MapContainer>

        {perimeter && (
          <Alert
            message="Perimeter Details"
            description={`Radius: ${(perimeter.radius / 1000).toFixed(2)} km from center`}
            type="info"
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};

export default LocationMap;
