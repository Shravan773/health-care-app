import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useAuth } from '../context/AuthContext';

const SignupForm = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log('Signup initiated:', { 
        email: values.email,
        username: values.username,
        hasPassword: !!values.password
      });
      
      await login({
        authorizationParams: {
          screen_hint: 'signup',
          connection: 'Username-Password-Authentication',
        },
        appState: {
          returnTo: window.location.pathname
        },
        initialScreen: 'signUp',
        signup: {
          email: values.email,
          username: values.username,
          password: values.password,
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      message.error('Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      name="signup"
      onFinish={onFinish}
      layout="vertical"
      requiredMark={false}
    >
      <Form.Item
        name="username"
        rules={[
          { required: true, message: 'Please input your username!' },
          { min: 1, max: 15, message: 'Username must be between 1-15 characters' }
        ]}
      >
        <Input placeholder="Username" />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          { required: true, message: 'Please input your email!' },
          { type: 'email', message: 'Please enter a valid email!' }
        ]}
      >
        <Input placeholder="Email" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: 'Please input your password!' },
          { min: 8, message: 'Password must be at least 8 characters' }
        ]}
      >
        <Input.Password placeholder="Password" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Sign Up
        </Button>
      </Form.Item>
    </Form>
  );
};

export default SignupForm;
