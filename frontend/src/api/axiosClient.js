import axios from 'axios';

// Cách kiểm tra chuẩn nhất: Kiểm tra biến global Capacitor
// Nếu biến này tồn tại, nghĩa là code đang chạy bên trong App Mobile
const isMobileApp = window.Capacitor !== undefined;

// Logic chọn URL:
// 1. Nếu là App Mobile (isMobileApp = true) -> LUÔN dùng Render
// 2. Nếu là Web, nhưng không phải localhost (đã deploy) -> Dùng Render
// 3. Chỉ dùng localhost:8000 khi đang code trên máy tính (Web Local)
const API_URL = (isMobileApp || (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"))
  ? "https://apptrano-api.onrender.com" 
  : "http://localhost:8000"; 

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động chèn Token vào Header trước khi gửi request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Xử lý lỗi tập trung
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      // Dùng window.location.pathname thay vì href để mượt hơn trên mobile
      if (window.location.pathname !== '/') {
          window.location.href = '/'; 
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
