import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import HospitalLogin from './HospitalLogin';
import AdminLogin from './AdminLogin';
import NetworkLogin from './NetworkLogin';

const Login = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const role = searchParams.get('role');

  if (role === 'admin') {
    return <AdminLogin />;
  }

  if (role === 'network') {
    return <NetworkLogin />;
  }
  
  if (role === 'hospital') {
    return <HospitalLogin />;
  }

  // Default fallback if no valid role is provided
  return <Navigate to="/login?role=hospital" replace />;
};

export default Login;
