import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Sun, Moon, Languages } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const LoginPage = () => {
  // --- STATES ---
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('nephew');
  const [loading, setLoading] = useState(false);
  
  // Khởi tạo Dark Mode từ localStorage
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  
  // Khởi tạo Ngôn ngữ từ localStorage (mặc định là 'vi')
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'vi');

  const { login } = useAuth();
  const navigate = useNavigate();

  // --- TRANSLATIONS DATA ---
  const t = {
    vi: {
      title: "APAL FINANCE",
      welcome: "Chào mừng bạn quay trở lại!",
      createAcc: "Bắt đầu quản lý tài chính ngay",
      userLabel: "Tên đăng nhập",
      passLabel: "Mật khẩu",
      roleLabel: "Bạn là ai?",
      nephew: "Người góp",
      uncle: "Ông Chủ",
      btnLogin: "ĐĂNG NHẬP",
      btnRegister: "TẠO TÀI KHOẢN",
      processing: "ĐANG XỬ LÝ...",
      noAcc: "Chưa có tài khoản? Đăng ký ngay",
      hasAcc: "Đã có tài khoản? Đăng nhập",
      regSuccess: "Đăng ký thành công! Hãy đăng nhập."
    },
    en: {
      title: "APAL FINANCE",
      welcome: "Welcome back, Boss!",
      createAcc: "Start managing finance now",
      userLabel: "Username",
      passLabel: "Password",
      roleLabel: "Your Role?",
      nephew: "Contributor",
      uncle: "Manager",
      btnLogin: "LOGIN",
      btnRegister: "SIGN UP",
      processing: "PROCESSING...",
      noAcc: "New here? Register now",
      hasAcc: "Already have account? Login",
      regSuccess: "Registration successful! Please login."
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    // Cập nhật Theme
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    // Cập nhật Language
    localStorage.setItem('lang', lang);
  }, [darkMode, lang]);

  // --- HANDLERS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLoginView) {
        await login(username, password);
        navigate('/');
      } else {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('role', role);
        
        await axiosClient.post('/auth/register', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert(t[lang].regSuccess);
        setIsLoginView(true);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Error!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 flex items-center justify-center p-4 relative overflow-hidden
      ${darkMode ? 'bg-slate-950 text-white' : 'bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-white to-slate-100'}`}>
      
      {/* --- TOP ACTIONS (Lang & Theme) --- */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
        {/* Toggle Language */}
        <button 
          type="button"
          onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-slate-700 shadow-xl hover:scale-105 transition-all font-bold text-xs uppercase"
        >
          <Languages size={18} className="text-blue-500" />
          <span>{lang === 'vi' ? 'English' : 'Tiếng Việt'}</span>
        </button>

        {/* Toggle Theme */}
        <button 
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="p-3 rounded-2xl bg-white/10 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-slate-700 shadow-xl hover:scale-110 active:scale-95 transition-all group"
        >
          {darkMode ? (
            <Sun className="text-yellow-400 group-hover:rotate-45 transition-transform" size={22} />
          ) : (
            <Moon className="text-blue-600 group-hover:-rotate-12 transition-transform" size={22} />
          )}
        </button>
      </div>

      {/* Trang trí Background */}
      <div className={`absolute top-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-pulse ${darkMode ? 'bg-blue-900' : 'bg-blue-200'}`}></div>
      <div className={`absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-pulse ${darkMode ? 'bg-purple-900' : 'bg-purple-200'}`}></div>

      {/* --- MAIN CARD --- */}
      <div className="relative bg-white/70 dark:bg-slate-900/80 backdrop-blur-3xl p-8 md:p-12 rounded-[3.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_rgba(0,0,0,0.4)] w-full max-w-md border border-white/40 dark:border-slate-800/50 transition-all duration-500">
        
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl shadow-xl mb-6 text-white transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <ShieldCheck size={36} />
          </div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 mb-2 tracking-tight">
            {t[lang].title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">
            {isLoginView ? t[lang].welcome : t[lang].createAcc}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* User Input */}
          <div className="group">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 ml-5 mb-1.5 uppercase tracking-widest">{t[lang].userLabel}</label>
            <div className="bg-slate-100/60 dark:bg-slate-800/60 p-4 rounded-[1.5rem] flex items-center gap-4 border-2 border-transparent group-focus-within:border-blue-500/50 group-focus-within:bg-white dark:group-focus-within:bg-slate-800 transition-all duration-300">
              <User className="text-slate-400 group-focus-within:text-blue-500" size={20} />
              <input value={username} onChange={e=>setUsername(e.target.value)} required placeholder="..." className="bg-transparent outline-none w-full font-bold text-slate-700 dark:text-slate-100"/>
            </div>
          </div>

          {/* Pass Input */}
          <div className="group">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 ml-5 mb-1.5 uppercase tracking-widest">{t[lang].passLabel}</label>
            <div className="bg-slate-100/60 dark:bg-slate-800/60 p-4 rounded-[1.5rem] flex items-center gap-4 border-2 border-transparent group-focus-within:border-blue-500/50 group-focus-within:bg-white dark:group-focus-within:bg-slate-800 transition-all duration-300">
              <Lock className="text-slate-400 group-focus-within:text-blue-500" size={20} />
              <input value={password} onChange={e=>setPassword(e.target.value)} required type={showPassword ? "text" : "password"} placeholder="••••••••" className="bg-transparent outline-none w-full font-bold text-slate-700 dark:text-slate-100"/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-blue-500 transition-colors px-1">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Role Choice */}
          {!isLoginView && (
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 ml-5 uppercase tracking-widest">{t[lang].roleLabel}</label>
              <div className="flex gap-3 bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-[1.5rem]">
                <button type="button" onClick={()=>setRole('nephew')} className={`flex-1 py-3 rounded-[1.1rem] font-bold text-xs transition-all ${role==='nephew' ? 'bg-white dark:bg-slate-700 shadow-lg text-blue-600 dark:text-blue-400' : 'text-slate-500 opacity-60'}`}>
                  {t[lang].nephew}
                </button>
                <button type="button" onClick={()=>setRole('uncle')} className={`flex-1 py-3 rounded-[1.1rem] font-bold text-xs transition-all ${role==='uncle' ? 'bg-white dark:bg-slate-700 shadow-lg text-green-600 dark:text-green-400' : 'text-slate-500 opacity-60'}`}>
                  {t[lang].uncle}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button 
            disabled={loading} 
            className="group relative w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-2xl shadow-blue-300/50 dark:shadow-none hover:bg-blue-700 hover:-translate-y-1 active:scale-95 transition-all duration-300 overflow-hidden mt-4"
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="tracking-widest text-sm">{t[lang].processing}</span>
                </>
              ) : (
                <>
                  <span className="tracking-widest">{isLoginView ? t[lang].btnLogin : t[lang].btnRegister}</span>
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-300" />
                </>
              )}
            </div>
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12"></div>
          </button>
        </form>

        <div className="mt-10 text-center">
          <button type="button" onClick={()=>setIsLoginView(!isLoginView)} className="text-sm font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
            {isLoginView ? t[lang].noAcc : t[lang].hasAcc}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 0.8s linear infinite; }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
};

export default LoginPage;
