import { Result, Button } from 'antd';
import { WifiOutlined } from '@ant-design/icons';

const OfflineFallback = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Result
      icon={<WifiOutlined />}
      title="You are offline"
      subTitle="Some features may be limited until you reconnect to the internet"
      extra={
        <Button type="primary" onClick={handleRefresh}>
          Retry Connection
        </Button>
      }
    />
  );
};

export default OfflineFallback;
