import { Layout, Menu, Button, Avatar, Drawer } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuth0 } from '@auth0/auth0-react';
import { MenuOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useState } from 'react';

// Styled Components
const HeaderContainer = styled(Layout.Header)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 64px;
  background-color: #001529; /* Keeps dark blue navbar */

  @media (max-width: 768px) {
    padding: 0 10px;
  }
`;

const Logo = styled.div`
  color: white;
  font-size: 1.5rem;
  white-space: nowrap;
`;

const CenterContent = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;

  a {
    color: white;
    text-decoration: none;
    font-size: 1rem;
    padding: 0 12px;
  }

  a:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    display: none; /* Hide on mobile */
  }
`;

const AuthWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
`;

const Navbar = () => {
  const { user } = useAuth();
  const { loginWithRedirect, logout: auth0Logout, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const dashboardLink = user ? (user.role === 'manager' ? '/manager' : '/careworker') : null;

  const handleLogout = () => {
    auth0Logout({ returnTo: window.location.origin });
  };

  return (
    <HeaderContainer>
      <Logo>Healthcare Clock</Logo>

      {dashboardLink && (
        <CenterContent>
          <a href={dashboardLink}>Dashboard</a>
        </CenterContent>
      )}

      <AuthWrapper>
        {isAuthenticated ? (
          <>
            <Avatar>{user?.name?.[0]}</Avatar>
            <span style={{ color: 'white' }}>{user?.name} ({user?.role})</span>
            <Button onClick={handleLogout} loading={isLoading}>Logout</Button>
          </>
        ) : (
          <Button type="primary" onClick={loginWithRedirect} loading={isLoading}>
            Login
          </Button>
        )}

        {/* Hamburger Menu for Mobile View */}
        <MenuOutlined
          style={{ color: 'white', fontSize: '24px', display: 'none' }}
          onClick={() => setDrawerVisible(true)}
          className="mobile-menu"
        />

        <Drawer
          title="Menu"
          placement="right"
          closable
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          bodyStyle={{ padding: '0' }}
        >
          {dashboardLink && <Menu.Item onClick={() => navigate(dashboardLink)}>Dashboard</Menu.Item>}
          {isAuthenticated && <Menu.Item onClick={handleLogout}>Logout</Menu.Item>}
        </Drawer>
      </AuthWrapper>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu {
            display: block;
          }
        }
      `}</style>
    </HeaderContainer>
  );
};

export default Navbar;
