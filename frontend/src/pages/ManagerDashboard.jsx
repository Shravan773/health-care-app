import React, { useEffect, useState } from 'react';
import { Layout, Card, Tabs, Modal, Form, Input, Button, Row, Col, message, Spin, Typography, Statistic, Table } from 'antd';
import { UserOutlined, FieldTimeOutlined, TeamOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import StaffTable from '../components/StaffTable';
import LocationMap from '../components/LocationMap';
import { useAuth } from '../context/AuthContext';
import { usePerimeter } from '../context/PerimeterContext';  // Add this import
import { useNavigate } from 'react-router-dom';
import { useApolloClient, useQuery } from '@apollo/client';
import { GET_DASHBOARD_STATS, STAFF_OVERVIEW } from '../api/client'; // Updated import path
import styled from 'styled-components';

const { Content } = Layout;
const { Title } = Typography;
const { TabPane } = Tabs;

const StatsCard = styled(Card)`
  .ant-statistic {
    @media (max-width: 768px) {
      text-align: center;
    }
  }
`;

const ResponsiveContent = styled(Content)`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 12px;
    
    .ant-tabs-nav {
      margin-bottom: 12px;
    }
    
    .ant-card {
      margin-bottom: 12px;
    }
  }
`;

const ManagerDashboard = () => {
  const { updatePerimeter, user, isLoading: authLoading } = useAuth();
  const { perimeter, refreshPerimeter } = usePerimeter();
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const navigate = useNavigate();

  // Replace manual query with useQuery hook
  const { loading: statsLoading, error: statsError, data: dashboardStats } = useQuery(GET_DASHBOARD_STATS, {
    pollInterval: 30000, // Optional: Poll every 30 seconds
    fetchPolicy: 'network-only'
  });

  const { loading: staffLoading, error: staffError, data: staffData } = useQuery(STAFF_OVERVIEW, {
    fetchPolicy: 'network-only'
  });

  // Add error handling
  useEffect(() => {
    if (statsError) {
      console.error('Dashboard stats error:', statsError);
      message.error('Failed to fetch dashboard statistics');
    }
    if (staffError) {
      console.error('Staff overview error:', staffError);
      message.error('Failed to fetch staff data');
    }
  }, [statsError, staffError]);

  // Stricter role check
  useEffect(() => {
    if (!authLoading) {
      const storedRole = localStorage.getItem('user_role');
      if (storedRole !== 'MANAGER') {
        message.error('Unauthorized access');
        navigate('/', { replace: true });
      }
    }
  }, [authLoading, navigate]);

  const handleUpdatePerimeter = async (values) => {
    try {
      const response = await updatePerimeter({
        center: {
          lat: 12.9564672,
          lng: 77.594624
        },
        radius: parseFloat(values.radius),
      });
      
      if (response) {
        message.success('Perimeter updated successfully!');
        await refreshPerimeter();
      }
      
      setIsSettingsModalVisible(false);
    } catch (error) {
      console.error('Perimeter update failed:', {
        error,
        values,
        timestamp: new Date().toISOString()
      });
      message.error('Failed to update perimeter. Please try again.');
    }
  };

  const getDailyStats = () => dashboardStats?.getDashboardStats?.dailyStats || [];
  const getWeeklyHoursByStaff = () => dashboardStats?.getDashboardStats?.weeklyHoursByStaff || [];

  const dailyHoursConfig = {
    data: getDailyStats(),
    xField: 'day',
    yField: 'avgHours',
    smooth: true,
    point: {
      size: 5,
      shape: 'circle',
    },
    label: {
      style: { fill: '#666' },
      formatter: (v) => `${(v.avgHours || 0).toFixed(1)}h`,
    },
    xAxis: {
      title: { text: 'Days of the Week' },
    },
    yAxis: {
      title: { text: 'Average Hours Worked' },
    },
    color: '#1890ff',
    height: 300,
  };

  // Update loading condition
  if (authLoading || statsLoading || staffLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <Layout>
      <ResponsiveContent>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
          Healthcare Staff Dashboard
        </Title>
        
        {/* Key Metrics */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatsCard>
              <Statistic
                title="Total Staff Members"
                value={dashboardStats?.getDashboardStats?.totalStaffCount || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </StatsCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatsCard>
              <Statistic
                title="Currently On Duty"
                value={dashboardStats?.getDashboardStats?.activeStaffCount || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </StatsCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatsCard>
              <Statistic
                title="Today's Average Hours"
                value={dashboardStats?.getDashboardStats?.averageHoursToday || 0}
                precision={1}
                suffix="hrs"
                prefix={<FieldTimeOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </StatsCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatsCard>
              <Statistic
                title="Today's Clock-ins"
                value={dashboardStats?.getDashboardStats?.clockInsToday || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </StatsCard>
          </Col>
        </Row>

        <Tabs 
          defaultActiveKey="1"
          tabBarGutter={12}
          style={{ 
            overflow: 'auto',
            width: '100%' 
          }}
        >
          <TabPane tab="Location Settings" key="1">
            <Card title="Perimeter Settings">
              <LocationMap />
              <Input.Group compact style={{ marginTop: '16px' }}>
                <Input
                  style={{ width: '70%' }}
                  placeholder="Radius in meters"
                  type="number"
                  value={perimeter?.radius || ''}
                  readOnly
                />
                <Button type="primary" onClick={() => setIsSettingsModalVisible(true)}>
                  Update
                </Button>
              </Input.Group>
            </Card>
          </TabPane>

          <TabPane tab="Staff Records" key="2">
            <StaffTable loading={staffLoading} data={staffData?.staffOverview || []} />
          </TabPane>

          <TabPane tab="Weekly Analysis" key="3">
            <Row gutter={[16, 16]}>
              <Col xs={24}> {/* Make the chart take full width on small screens */}
                <Card title="Daily Hours Distribution (Monday-Saturday)">
                  <Line {...dailyHoursConfig} />
                </Card>
              </Col>
              <Col xs={24}> {/* Make the table take full width on small screens */}
                <Card title="Staff Weekly Hours Details">
                  <Table
                    dataSource={getWeeklyHoursByStaff()}
                    rowKey="staffName"
                    pagination={{ pageSize: 10 }}
                    columns={[
                      {
                        title: 'Staff Member',
                        dataIndex: 'staffName',
                        key: 'staffName',
                      },
                      {
                        title: 'Total Hours',
                        dataIndex: 'totalHours',
                        key: 'totalHours',
                        render: (hours) => `${hours.toFixed(1)} hours`,
                        sorter: (a, b) => a.totalHours - b.totalHours,
                      },
                      {
                        title: 'Daily Average',
                        dataIndex: 'totalHours',
                        key: 'avgHours',
                        render: (hours) => `${(hours / 6).toFixed(1)} hours`,
                      }
                    ]}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>

        <Modal
          title="Update Perimeter"
          visible={isSettingsModalVisible}
          onCancel={() => setIsSettingsModalVisible(false)}
          footer={null}
        >
          <Form onFinish={handleUpdatePerimeter} layout="vertical">
            <Form.Item
              name="radius"
              label="Radius (meters)"
              rules={[{ required: true, message: 'Please input the radius!' }]}
            >
              <Input type="number" placeholder="Enter radius in meters" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Update Perimeter
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </ResponsiveContent>
    </Layout>
  );
};

export default ManagerDashboard;
