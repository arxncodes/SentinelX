import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { useWebSocketStore } from '../../store/wsStore';
import { Toaster } from 'react-hot-toast';

export const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { connect, disconnect } = useWebSocketStore();

  useEffect(() => {
    if (isAuthenticated) {
      connect();
      return () => disconnect();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-sentinel-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#141e35',
            color: '#e2e8f0',
            border: '1px solid #1e2d4a',
            fontSize: '13px',
          },
        }}
      />
    </div>
  );
};
