import { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import { useAuth } from '../context/AuthContext';
import { usePerimeter } from '../context/PerimeterContext';
import { isWithinPerimeter } from '../api/client';

export const LocationMonitor = () => {
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const { isClockIn, user } = useAuth();
  const { perimeter } = usePerimeter();
  const [wasInPerimeter, setWasInPerimeter] = useState(null); // Changed to null for initial state

  const showNotification = useCallback((messageText, type = 'info') => {
    // Try system notification first
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          // Force a new notification
          const notification = new Notification("Healthcare Clock", {
            body: messageText,
            icon: "/icon.png",
            tag: 'location-change-' + Date.now(), // Unique tag to ensure multiple notifications
            requireInteraction: true, // Keep notification until user interacts
            renotify: true, // Force renotification
            vibrate: [200, 100, 200] // Vibration pattern
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }
      });
    }

    // Always show alert as backup
    setTimeout(() => {
      alert(messageText);
    }, 100);

    // Also show Ant Design message
    message.info({
      content: messageText,
      duration: 10,
      className: 'location-notification',
      style: {
        marginTop: '20vh',
        fontWeight: 'bold',
        fontSize: '16px'
      }
    });
  }, [message]); // Add message to useCallback dependencies

  const checkLocationAndNotify = useCallback((position) => {
    if (!perimeter || !user) return;

    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'CAREWORKER') return;

    const currentLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    const isInPerimeter = isWithinPerimeter(
      currentLocation,
      perimeter.center,
      perimeter.radius
    );

    if (wasInPerimeter !== null && wasInPerimeter !== isInPerimeter) {
      if (!isInPerimeter && isClockIn) {
        showNotification('Warning: You have left the work area! Please clock out.');
      } else if (isInPerimeter && !isClockIn) {
        showNotification('You have entered the work area. Remember to clock in!');
      }
    }

    setWasInPerimeter(isInPerimeter);
  }, [perimeter, isClockIn, user, wasInPerimeter, showNotification]);

  const handleLocationError = (error) => {
    switch (error.code) {
      case error.TIMEOUT:
        message.warning('Location request timed out. Retrying...');
        break;
      case error.PERMISSION_DENIED:
        message.error('Please enable location services to use this app');
        break;
      case error.POSITION_UNAVAILABLE:
        message.warning('Location information is unavailable. Retrying...');
        break;
      default:
        message.error('Unable to get your location');
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      message.error('Your browser does not support location services');
      return;
    }

    const geolocationOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 15000
    };

    let watchId;
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          checkLocationAndNotify(position);

          watchId = navigator.geolocation.watchPosition(
            checkLocationAndNotify,
            handleLocationError,
            geolocationOptions
          );
        },
        (error) => {
          handleLocationError(error);
        },
        geolocationOptions
      );
    } catch (e) {
      message.error('Failed to initialize location services');
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [checkLocationAndNotify]);

  // Request notification permission when component mounts
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return null;
};
