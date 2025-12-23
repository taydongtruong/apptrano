import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Khi load app, kiểm tra xem có user trong localStorage không
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    const username = localStorage.getItem('user_name');

    if (token && role && username) {
      setUser({ token, role, username });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // Lưu ý: Backend mới của chúng ta dùng OAuth2PasswordRequestForm
    // Nên phải gửi dưới dạng URLSearchParams hoặc FormData
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await axiosClient.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, role } = response.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_name', username);

    setUser({ username, role, token: access_token });
    return response.data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook tùy chỉnh để sử dụng nhanh
export const useAuth = () => useContext(AuthContext);