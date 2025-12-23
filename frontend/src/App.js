import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Wallet, CheckCircle, TrendingUp, ListChecks, UserCircle, Clock, X, ZoomIn, LogOut, Lock, User } from 'lucide-react';

// --- CẤU HÌNH API ---
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8000" 
  : "https://apptrano-api.onrender.com"; 

function App() {
  // --- STATE ---
  const [user, setUser] = useState(null); // Lưu thông tin user { username, role }
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  
  // State cho form Login/Register
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('nephew'); // Chỉ dùng khi đăng ký

  // State dữ liệu chính
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ current_total: 0, total_goal: 45000000, percentage: 0, pending_total: 0 });
  const [payments, setPayments] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  // --- CẤU HÌNH AXIOS ---
  // Tự động gắn Token vào mọi request nếu đã đăng nhập
  const api = axios.create({ baseURL: API_URL });
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // --- EFFECT TỰ ĐỘNG CẬP NHẬT (REAL-TIME POLLING) ---
  useEffect(() => {
    // 1. Lấy thông tin user từ localStorage khi load trang
    const savedRole = localStorage.getItem('user_role');
    const savedName = localStorage.getItem('user_name');
    if (savedRole && token) {
      setUser({ role: savedRole, username: savedName });
    }

    // 2. Hàm thực hiện lấy toàn bộ dữ liệu
    const refreshData = () => {
      fetchStats(); // Cập nhật thanh tiến độ (cho cả chú và cháu)
      
      // Nếu là ông chú thì cập nhật thêm danh sách các khoản cần duyệt
      const currentRole = localStorage.getItem('user_role');
      if (currentRole === 'uncle' && token) {
        fetchPayments();
      }
    };

    // 3. Chạy lần đầu tiên ngay khi vào trang
    refreshData();

    // 4. Thiết lập vòng lặp 5 giây chạy lại một lần
    const interval = setInterval(refreshData, 5000); 

    // 5. Dọn dẹp vòng lặp khi tắt app để tránh tốn pin/RAM
    return () => clearInterval(interval);
  }, [token]);

  // --- AUTH FUNCTIONS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        // FastAPI OAuth2 cần gửi dạng Form Data
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const res = await axios.post(`${API_URL}/login`, formData);
        
        // Lưu thông tin
        const { access_token, role } = res.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user_role', role);
        localStorage.setItem('user_name', username);
        
        setToken(access_token);
        setUser({ username, role });
        if(role === 'uncle') fetchPayments();
        alert(`Xin chào ${role === 'uncle' ? 'Ông Chủ' : 'Người trả góp'}!`);
    } catch (err) {
        alert("Đăng nhập thất bại! Kiểm tra lại tài khoản/mật khẩu.");
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('role', role);

        await axios.post(`${API_URL}/register`, formData);
        alert("Đăng ký thành công! Hãy đăng nhập ngay.");
        setIsLoginView(true); // Chuyển về trang login
    } catch (err) {
        alert("Đăng ký lỗi! Có thể tên đăng nhập đã tồn tại.");
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    setPayments([]);
  };

  // --- DATA FUNCTIONS ---
  const fetchStats = async () => {
    try {
      const res = await api.get(`/stats`);
      setStats(res.data);
    } catch (err) { console.error("Lỗi stats", err); }
  };

  const fetchPayments = async () => {
    try {
      const res = await api.get(`/admin/payments`);
      setPayments(res.data);
    } catch (err) { console.error("Lỗi payments", err); }
  };

  const handleSubmit = async () => {
    if (!amount || !file) return alert("Thiếu tiền hoặc ảnh!");
    setLoading(true);
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('file', file);

    try {
      await api.post(`/payments/`, formData);
      alert("Đã gửi! Chờ Ông Chủ duyệt.");
      setAmount(''); setFile(null);
      fetchStats();
    } catch (error) { 
      alert("Lỗi! Có thể phiên đăng nhập hết hạn."); 
    } finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/approve/${id}`);
      alert("Đã duyệt thành công!");
      fetchPayments(); 
      fetchStats();
    } catch (error) { alert("Lỗi khi duyệt!"); }
  };

  // --- UI COMPONENTS ---

  // 1. Màn hình Auth (Login/Register)
  if (!token) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 animate-fade-in-up">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-blue-600 mb-2">APP TRẢ NỢ</h1>
                    <p className="text-slate-400">{isLoginView ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản mới'}</p>
                </div>

                <form onSubmit={isLoginView ? handleLogin : handleRegister} className="space-y-4">
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
    )
  }

  // 2. Màn hình Chính (Dashboard)
  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12 font-sans relative">
      
      {/* HEADER USER & LOGOUT */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user?.role === 'uncle' ? 'bg-green-500' : 'bg-blue-500'}`}>
                {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
                <p className="font-black text-slate-700 leading-tight">{user?.username}</p>
                <p className="text-xs font-bold text-slate-400 uppercase">{user?.role === 'uncle' ? 'Người Duyệt (Admin)' : 'Người Nạp'}</p>
            </div>
        </div>
        <button onClick={handleLogout} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all">
            <LogOut size={20} />
        </button>
      </div>

      {/* MODAL VIEW ẢNH */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full"><X size={32} /></button>
          <img src={selectedImage} alt="Full size" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* STATS CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-blue-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            <TrendingUp className="absolute right-[-20px] top-[-20px] w-48 h-48 text-white/10" />
            <div className="relative z-10">
              <p className="uppercase tracking-widest text-xs font-black text-blue-200">Tổng tiền đã xác nhận</p>
              <h1 className="text-5xl md:text-7xl font-black mt-2 tracking-tighter">
                {stats.current_total.toLocaleString()}<span className="text-2xl ml-2 font-light text-blue-200">đ</span>
              </h1>
              <div className="mt-10">
                <div className="flex justify-between mb-3 text-sm font-bold">
                  <span>Tiến độ: {stats.percentage}%</span>
                  <span>Mục tiêu: {stats.total_goal.toLocaleString()}đ</span>
                </div>
                <div className="w-full bg-blue-900/30 h-5 rounded-full p-1 border border-white/10">
                  <div className="bg-white h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.percentage}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl flex flex-col justify-center">
            <div className="flex items-center gap-3 text-orange-500 mb-2">
              <Clock size={20} />
              <p className="font-bold text-sm uppercase">Đang chờ duyệt</p>
            </div>
            <p className="text-4xl font-black text-slate-800 tracking-tight">{stats.pending_total.toLocaleString()}đ</p>
            <p className="text-slate-400 text-sm mt-2 font-medium">Cần Ông Chủ duyệt để cộng vào tổng.</p>
          </div>
        </div>

        {/* LOGIC HIỂN THỊ THEO ROLE */}
        {user?.role === 'nephew' ? (
          /* GIAO DIỆN CHÁU */
          <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3"><Wallet className="text-blue-600" size={30}/> Gửi khoản góp mới</h2>
            <div className="space-y-6">
                <input type="number" className="w-full text-5xl font-black p-8 bg-slate-50 rounded-[2rem] outline-none text-blue-600 border-4 border-transparent focus:border-blue-500/10 focus:bg-white transition-all placeholder:text-slate-200" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="0"/>
                <div className="grid grid-cols-4 gap-3">
                  {[100, 200, 500, 1000].map(v => (
                    <button key={v} onClick={()=>setAmount(v*1000)} className="py-4 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-2xl font-bold text-slate-600 transition-all">{v}k</button>
                  ))}
                </div>
                <label className={`flex flex-col items-center justify-center py-12 bg-slate-50 border-4 border-dashed rounded-[2rem] cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group ${file ? 'border-green-400 bg-green-50' : 'border-slate-200'}`}>
                  <Camera size={40} className={`mb-2 transition-colors ${file ? 'text-green-500' : 'text-slate-300 group-hover:text-blue-500'}`}/>
                  <span className={`font-bold px-4 text-center ${file ? 'text-green-600' : 'text-slate-400 group-hover:text-blue-600'}`}>
                    {file ? `Đã chọn: ${file.name}` : "Chạm để chụp/tải ảnh minh chứng"}
                  </span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e)=>setFile(e.target.files[0])}/>
                </label>
                <button onClick={handleSubmit} disabled={loading} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:opacity-50">
                  {loading ? "ĐANG GỬI..." : "GỬI NGAY 🚀"}
                </button>
            </div>
          </div>
        ) : (
          /* GIAO DIỆN ÔNG CHÚ */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payments.length === 0 && <p className="col-span-full text-center text-slate-400 italic py-10">Danh sách trống.</p>}
            
            {payments.map((p) => (
              <div key={p.id} className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${p.status ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600 animate-pulse'}`}>
                    {p.status ? 'Đã duyệt' : 'Đang chờ'}
                  </span>
                  <p className="text-slate-300 font-bold text-xs italic">#{p.id}</p>
                </div>
                
                <p className="text-3xl font-black text-slate-800 mb-4">{p.amount.toLocaleString()}đ</p>
                
                <div className="aspect-video bg-slate-100 rounded-3xl mb-6 overflow-hidden relative group cursor-pointer border border-slate-100" onClick={() => setSelectedImage(`${API_URL}/${p.proof_image_url}`)}>
                  <img src={`${API_URL}/${p.proof_image_url}`} alt="proof" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=Loi+anh"; }}/>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-all" size={32} />
                  </div>
                </div>

                {!p.status ? (
                  <button onClick={() => handleApprove(p.id)} className="mt-auto w-full py-4 bg-green-500 text-white rounded-2xl font-black hover:bg-green-600 shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 active:scale-95">
                    <CheckCircle size={20}/> DUYỆT NGAY
                  </button>
                ) : (
                   <button disabled className="mt-auto w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold cursor-default flex items-center justify-center gap-2">
                    <CheckCircle size={20}/> ĐÃ DUYỆT
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;