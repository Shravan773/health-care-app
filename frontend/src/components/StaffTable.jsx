import React, { useEffect } from 'react';
import { Table, Tag } from 'antd';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';

const ResponsiveTableContainer = styled.div`
  width: 100%;
  overflow-x: auto;

  .ant-table-wrapper {
    overflow-x: auto;
  }

  .ant-table-cell {
    white-space: nowrap;
    
    @media (max-width: 768px) {
      padding: 8px 4px !important;
      font-size: 12px;
      
      /* Allow text wrapping for name column */
      &:first-child {
        white-space: normal;
      }
    }
  }

  .ant-tag {
    @media (max-width: 768px) {
      font-size: 11px;
      padding: 0 4px;
      margin-right: 0;
    }
  }

  /* Adjust table header text */
  .ant-table-thead .ant-table-cell {
    @media (max-width: 768px) {
      padding: 8px 4px !important;
      font-size: 12px;
      white-space: normal;
      text-align: center;
    }
  }
`;

const StaffTable = () => {
  const { staff, fetchStaff } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => {
      fetchStaff();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [fetchStaff]);

  // Helper function to get the most recent activity timestamp
  const getMostRecentActivity = (record) => {
    const lastClockIn = record.lastClockIn ? new Date(record.lastClockIn).getTime() : 0;
    const lastClockOut = record.lastClockOut ? new Date(record.lastClockOut).getTime() : 0;
    return Math.max(lastClockIn, lastClockOut);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '20%',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      align: 'center',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Clock',
      dataIndex: 'isClockIn',
      key: 'isClockIn',
      width: '15%',
      align: 'center',
      render: (isClockIn) => (
        <Tag color={isClockIn ? 'green' : 'orange'}>
          {isClockIn ? 'In' : 'Out'}
        </Tag>
      ),
    },
    {
      title: 'Last In',
      dataIndex: 'lastClockIn',
      key: 'lastClockIn',
      width: '25%',
      align: 'center',
      render: (time) => time ? new Date(time).toLocaleString() : 'N/A',
      sorter: (a, b) => {
        const timeA = a.lastClockIn ? new Date(a.lastClockIn).getTime() : 0;
        const timeB = b.lastClockIn ? new Date(b.lastClockIn).getTime() : 0;
        return timeA - timeB;
      },
    },
    {
      title: 'Last Out',
      dataIndex: 'lastClockOut',
      key: 'lastClockOut',
      width: '25%',
      align: 'center',
      render: (time) => time ? new Date(time).toLocaleString() : 'N/A',
      sorter: (a, b) => {
        const timeA = a.lastClockOut ? new Date(a.lastClockOut).getTime() : 0;
        const timeB = b.lastClockOut ? new Date(b.lastClockOut).getTime() : 0;
        return timeA - timeB;
      },
    },
  ];

  return (
    <ResponsiveTableContainer>
      <Table
        dataSource={[...(staff || [])].sort((a, b) => {
          return getMostRecentActivity(b) - getMostRecentActivity(a);
        })}
        columns={columns}
        rowKey="id"
        pagination={{ 
          pageSize: 10,
          size: 'small',
          responsive: true
        }}
        bordered
        loading={!staff}
        scroll={{ x: 'max-content' }}
        size="small"
      />
    </ResponsiveTableContainer>
  );
};

export default StaffTable;
