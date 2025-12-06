import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import ApiDocsPage from './pages/ApiDocsPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center bg-black text-teal-500">Loading Carbon.AI...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Route that redirects to Dashboard if already logged in
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          } />

          {/* New 3D Landing Hub */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <LandingPage />
            </ProtectedRoute>
          } />

          {/* Actual Functional Tool Workspace */}
          <Route path="/workspace" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }} />
      </AuthProvider>
    </Router>
  );
}

export default App;