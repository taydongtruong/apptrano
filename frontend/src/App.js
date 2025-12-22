import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Wallet, CheckCircle, TrendingUp, ListChecks, UserCircle, Clock, X, ZoomIn } from 'lucide-react';

// CẤU HÌNH TỰ ĐỘNG CHỌN SERVER
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8000" 
  : "https://apptrano-api.onrender.com"; 

function App() {
  // --- STATE ---
  const [view, setView] = useState('nephew');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ current_total: 0, total_goal: 45000000, percentage: 0, pending_total: 0 });
  const [payments, setPayments] = useState([]);
  
  // STATE MỚI: Dùng để lưu link ảnh đang được xem phóng to (null = không xem gì)
  const [selectedImage, setSelectedImage] = useState(null);

  // --- HÀM LẤY DỮ LIỆU ---
  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/stats`);
      setStats(res.data);
    } catch (err) { console.error("Lỗi lấy thông số:", err); }
  };

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/payments`);
      setPayments(res.data);
    } catch (err) { console.error("Lỗi lấy danh sách:", err); }
  };

  useEffect(() => {
    fetchStats();
    if (view === 'uncle') fetchPayments();
  }, [view]);

  // --- HÀM GỬI TIỀN ---
  const handleSubmit = async () => {
    if (!amount || !file) return alert("Vui lòng nhập số tiền và chụp ảnh!");
    setLoading(true);
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('file', file);

    try {
      await axios.post(`${API_URL}/payments/`, formData);
      alert("Đã gửi thành công! Chờ Ông Chú xác nhận nhé.");
      setAmount(''); setFile(null);
      fetchStats();
    } catch (error) { 
      console.error(error);
      alert("Có lỗi xảy ra! Vui lòng kiểm tra mạng."); 
    } finally { setLoading(false); }
  };

  // --- HÀM DUYỆT TIỀN ---
  const handleApprove = async (id) => {
    try {
      await axios.post(`${API_URL}/admin/approve/${id}`);
      fetchPayments(); fetchStats();
    } catch (error) { alert("Lỗi khi duyệt khoản này!"); }
  };

  // --- GIAO DIỆN ---
  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12 font-sans relative">
      
      {/* === MODAL PHÓNG TO ẢNH (MỚI) === */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)} // Bấm ra ngoài là đóng
        >
          <button className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full hover:bg-white/40 transition-all">
            <X size={32} />
          </button>
          <img 
            src={selectedImage} 
            alt="Full size proof" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border-2 border-white/20 animate-scale-up"
            onClick={(e) => e.stopPropagation()} // Bấm vào ảnh không đóng
          />
        </div>
      )}

      {/* NÚT CHUYỂN ROLE */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md shadow-2xl rounded-full p-2 flex gap-2 z-50 border border-slate-200">
        <button onClick={() => setView('nephew')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${view === 'nephew' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100'}`}>
          <UserCircle size={20}/> Cháu
        </button>
        <button onClick={() => setView('uncle')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${view === 'uncle' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'text-slate-500 hover:bg-slate-100'}`}>
          <ListChecks size={20}/> Ông Chú
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* HEADER THỐNG KÊ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-blue-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden transition-transform hover:scale-[1.01]">
            <TrendingUp className="absolute right-[-20px] top-[-20px] w-48 h-48 text-white/10" />
            <div className="relative z-10">
              <p className="uppercase tracking-widest text-xs font-black text-blue-200">Tiền đã khớp xác nhận</p>
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
            <p className="text-4xl font-black text-slate-800 tracking-tight">
              {stats.pending_total.toLocaleString()}đ
            </p>
            <p className="text-slate-400 text-sm mt-2 font-medium">Sẽ cộng vào tổng sau khi chú duyệt.</p>
          </div>
        </div>

        {view === 'nephew' ? (
          /* GIAO DIỆN CHÁU */
          <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 animate-fade-in-up">
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
                <button onClick={handleSubmit} disabled={loading} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "ĐANG GỬI..." : "GỬI NGAY 🚀"}
                </button>
            </div>
          </div>
        ) : (
          /* GIAO DIỆN ÔNG CHÚ */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
            {payments.length === 0 && (
              <p className="col-span-full text-center text-slate-400 italic py-10">Chưa có giao dịch nào.</p>
            )}
            
            {payments.map((p) => (
              <div key={p.id} className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${p.status ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600 animate-pulse'}`}>
                    {p.status ? 'Đã duyệt' : 'Đang chờ'}
                  </span>
                  <p className="text-slate-300 font-bold text-xs italic">ID: #{p.id}</p>
                </div>
                
                <p className="text-3xl font-black text-slate-800 mb-4">{p.amount.toLocaleString()}đ</p>
                
                {/* ẢNH THUMBNAIL CÓ CHỨC NĂNG CLICK ĐỂ PHÓNG TO */}
                <div 
                  className="aspect-video bg-slate-100 rounded-3xl mb-6 overflow-hidden relative group cursor-pointer border border-slate-100"
                  onClick={() => setSelectedImage(`${API_URL}/${p.proof_image_url}`)}
                >
                  <img 
                    src={`${API_URL}/${p.proof_image_url}`} 
                    alt="proof" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=Loi+anh"; }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100" size={32} />
                  </div>
                </div>

                {!p.status ? (
                  <button onClick={() => handleApprove(p.id)} className="mt-auto w-full py-4 bg-green-500 text-white rounded-2xl font-black hover:bg-green-600 shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 active:scale-95">
                    <CheckCircle size={20}/> XÁC NHẬN
                  </button>
                ) : (
                   <button disabled className="mt-auto w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold cursor-default flex items-center justify-center gap-2">
                    <CheckCircle size={20}/> ĐÃ XÁC NHẬN
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