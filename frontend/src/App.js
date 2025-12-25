import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CampaignsPage from './pages/CampaignsPage';

// Component bảo vệ: Chưa login thì đá về Login
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Đang tải...</div>;
  return user ? <Outlet /> : <Navigate to="/login" />;
};

// Component điều hướng thông minh sau khi Login
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Checking...</div>;
  if (!user) return <Navigate to="/login" />;
  
  // LOGIC: Uncle -> Xem list mục tiêu | Nephew -> Xem dashboard hiện tại
  if (user.role === 'uncle') return <Navigate to="/campaigns" />;
  return <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Trang gốc: Tự động điều hướng */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Các Route cần đăng nhập */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />      {/* Cho Cháu */}
            <Route path="/dashboard/:id" element={<Dashboard />} />  {/* Cho Chú (xem chi tiết) */}
            <Route path="/campaigns" element={<CampaignsPage />} />  {/* Cho Chú (xem list) */}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;