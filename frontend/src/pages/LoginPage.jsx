import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const LoginPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('nephew');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLoginView) {
        await login(username, password);
        navigate('/'); // Chuyển về Dashboard sau khi login
      } else {
        // Gọi trực tiếp axiosClient cho đăng ký (không cần qua context)
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('role', role);
        
        await axiosClient.post('/auth/register', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
        alert("Đăng ký thành công! Hãy đăng nhập.");
        setIsLoginView(true);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-600 mb-2">APP TRẢ NỢ</h1>
          <p className="text-slate-400">{isLoginView ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản mới'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-200 focus-within:border-blue-500 transition-colors">
            <User className="text-slate-400" />
            <input value={username} onChange={e=>setUsername(e.target.value)} required placeholder="Tên đăng nhập" className="bg-transparent outline-none w-full font-bold text-slate-700"/>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-200 focus-within:border-blue-500 transition-colors">
            <Lock className="text-slate-400" />
            <input value={password} onChange={e=>setPassword(e.target.value)} required type="password" placeholder="Mật khẩu" className="bg-transparent outline-none w-full font-bold text-slate-700"/>
          </div>

          {!isLoginView && (
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              <button type="button" onClick={()=>setRole('nephew')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${role==='nephew' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Người góp</button>
              <button type="button" onClick={()=>setRole('uncle')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${role==='uncle' ? 'bg-white shadow text-green-600' : 'text-slate-400'}`}>Ông Chủ</button>
            </div>
          )}

          <button disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
            {loading ? 'Đang xử lý...' : (isLoginView ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={()=>setIsLoginView(!isLoginView)} className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors">
            {isLoginView ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;