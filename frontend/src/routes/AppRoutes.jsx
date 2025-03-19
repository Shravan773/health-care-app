import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Login from '../pages/Login';
import ManagerDashboard from '../pages/ManagerDashboard';
import CareworkerDashboard from '../pages/CareworkerDashboard';
import RoleSelectionHandler from '../components/RoleSelectionHandler'; // Import RoleSelectionHandler

// Update getUserRole to not have a default
const getUserRole = () => {
  const { user } = useAuth();
  const localRole = localStorage.getItem('user_role');
  
  return localRole || null;  // Remove default CARE_WORKER
};

const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, isLoading, showRoleSelection } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // If role selection is needed, redirect to role-select
  if (showRoleSelection) {
    return <Navigate to="/role-select" replace />;
  }

  const userRole = getUserRole();

  if (userRole !== allowedRole) {
    const redirectPath = userRole === 'MANAGER' ? '/manager' : '/careworker';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

const RoleSelectionPage = () => {
  const { showRoleSelection } = useAuth();
  
  // If no role selection needed, redirect to home
  if (!showRoleSelection) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <RoleSelectionHandler />
    </Layout>
  );
};

const AppRoutes = () => {
  const { isAuthenticated, isLoading, user, showRoleSelection } = useAuth();

  const getDefaultRoute = () => {
    if (!isAuthenticated || !user) return '/login';
    if (showRoleSelection) return '/role-select';
    const role = getUserRole();
    if (!role) return '/role-select';
    return role.toUpperCase() === 'MANAGER' ? '/manager' : '/careworker';
  };

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        {isAuthenticated && !isLoading && !showRoleSelection && <Navbar />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/role-select" element={<RoleSelectionPage />} />
          <Route path="/manager" element={
            <ProtectedRoute allowedRole="MANAGER">
              <ManagerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/careworker" element={
            <ProtectedRoute allowedRole="CAREWORKER">
              <CareworkerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
          <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default AppRoutes;
