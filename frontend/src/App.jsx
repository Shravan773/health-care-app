import { Auth0Provider } from '@auth0/auth0-react';
import { ApolloProvider } from '@apollo/client';
import { client } from './api/client';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import RoleSelectionHandler from './components/RoleSelectionHandler';
import { LocationMonitor } from './components/LocationMonitor';
import { PerimeterProvider } from './context/PerimeterContext';
import PWAInstallButton from './components/PWAInstallButton';
import { useEffect } from 'react';
import { message } from 'antd';

const App = () => {
  useEffect(() => {
    // Check if running in PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('Running in PWA mode');
    }

    // Only keep the update notification
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        message.info('App updated. Please refresh for the latest version.');
      });
    }
  }, []);

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: 'openid profile email offline_access', // Make sure offline_access is included
        response_type: 'code',  // Add this line
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      useRefreshTokensFallback={true}
    >
      <ApolloProvider client={client}>
        <AuthProvider>
          <PerimeterProvider>
            <RoleSelectionHandler />
            <LocationMonitor />
            <AppRoutes />
            <PWAInstallButton />
          </PerimeterProvider>
        </AuthProvider>
      </ApolloProvider>
    </Auth0Provider>
  );
};

export default App;