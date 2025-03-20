import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Space } from 'antd';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { isAuthenticated, user, isLoading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const userRole = localStorage.getItem('user_role') || 
                      user['https://my-app.com/role'] || 
                      'CAREWORKER';

      if (userRole === 'MANAGER') {
        navigate('/manager', { replace: true });
      } else {
        navigate('/careworker', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, isLoading]);

  const handleLogin = () => {
    localStorage.removeItem('auth_signup_flow');
    login({
      authorizationParams: {
        prompt: 'login',
      }
    });
  };

  const handleSignup = () => {
    localStorage.setItem('auth_signup_flow', 'true');
    login({
      authorizationParams: {
        screen_hint: 'signup',
        prompt: 'login',
      }
    });
  };

  if (isLoading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: '#f0f2f5' 
    }}>
      <Card title="Healthcare Clock" style={{ width: 300, textAlign: 'center' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Button type="primary" onClick={handleSignup} size="large" block>
            Sign Up
          </Button>
          <Button onClick={handleLogin} size="large" block>
            Log In
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default Login;
