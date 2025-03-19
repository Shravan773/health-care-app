import { useEffect, useState } from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const StyledButton = styled(Button)`
  @media (max-width: 768px) {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
  }
`;

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      message.success('App installed successfully!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      message.info('Installation not available');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        message.success('Thank you for installing our app!');
      }
    } catch (err) {
      message.error('Installation failed. Please try again.');
    }
  };

  if (isInstalled || !deferredPrompt) return null;

  return (
    <StyledButton
      type="primary"
      icon={<DownloadOutlined />}
      onClick={handleInstall}
      size="large"
      shape="round"
    >
      Install App
    </StyledButton>
  );
};

export default PWAInstallButton;
