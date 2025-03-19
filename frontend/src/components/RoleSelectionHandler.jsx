import React, { useEffect } from 'react';
import { Modal, Button, Space, Typography, message } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Text } = Typography;

const RoleSelectionHandler = () => {
  const { user, showRoleSelection, handleRoleSelection } = useAuth();

  useEffect(() => {
    if (showRoleSelection) {
      // Removed console.log statement
    }
  }, [showRoleSelection, user]);

  const onRoleSelect = async (role) => {
    // Removed console.log statement
    await handleRoleSelection(role);
  };

  if (!user || !showRoleSelection) return null;

  return (
    <Modal
      title="Select Your Role"
      visible={showRoleSelection}
      closable={false}
      maskClosable={false}
      footer={null}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Text>Welcome! Please select your role:</Text>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            icon={<TeamOutlined />} 
            onClick={() => onRoleSelect('MANAGER')}
            block
            size="large"
          >
            I am a Manager
          </Button>
          <Button 
            icon={<UserOutlined />}
            onClick={() => onRoleSelect('CAREWORKER')}
            block
            size="large"
          >
            I am a Care Worker
          </Button>
        </Space>
      </Space>
    </Modal>
  );
};

export default RoleSelectionHandler;
