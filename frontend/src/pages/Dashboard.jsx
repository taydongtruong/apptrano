import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import StatsCard from '../components/StatsCard';
import Navbar from '../components/Navbar';
import { Camera, Wallet, CheckCircle, ZoomIn, X, Lock, Clock } from 'lucide-react'; // Thêm Clock icon

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ current_total: 0, total_goal: 45000000, percentage: 0, pending_total: 0 });
  const [payments, setPayments] = useState([]); 
  const [myPayments, setMyPayments] = useState([]);
  
  // State cho Form Nạp tiền
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // State cho Xem ảnh Full
  const [selectedImage, setSelectedImage] = useState(null);

  // State cho Modal Xác Nhận Duyệt
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, paymentId: null, paymentAmount: 0 });
  const [adminPass, setAdminPass] = useState('');
  const [approving, setApproving] = useState(false);

  const fetchData = async () => {
    try {
      const statsRes = await axiosClient.get('/stats');
      setStats(statsRes.data);
      if (user?.role === 'uncle') {
        const paymentsRes = await axiosClient.get('/admin/payments');
        setPayments(paymentsRes.data);
      } else {
        const myRes = await axiosClient.get('/payments/me');
        setMyPayments(myRes.data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSubmit = async () => {
    if (!amount || !file) return alert("Vui lòng nhập tiền và chọn ảnh!");
    setLoading(true);
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('file', file);
    try {
      await axiosClient.post('/payments/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Gửi thành công!");
      setAmount(''); setFile(null);
      fetchData();
    } catch (err) {
      alert("Lỗi khi gửi!");
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = (id, amount) => {
    setConfirmModal({ isOpen: true, paymentId: id, paymentAmount: amount });
    setAdminPass(''); 
  };

  const handleConfirmApprove = async () => {
    if (!adminPass) return alert("Vui lòng nhập mật khẩu xác nhận!");
    setApproving(true);
    try {
      await axiosClient.put(`/payments/${confirmModal.paymentId}/approve`, {
        password: adminPass
      });
      alert("✅ Đã duyệt thành công!");
      setConfirmModal({ isOpen: false, paymentId: null, paymentAmount: 0 });
      fetchData(); 
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Mật khẩu không đúng hoặc lỗi hệ thống!";
      alert("❌ " + errorMsg);
    } finally {
      setApproving(false);
    }
  };

  // Hàm format ngày tháng dùng chung cho cả 2 bên
  const formatDate = (dateString) => {
    try {
        const dateUTC = new Date(dateString.replace(' ', 'T') + 'Z');
        if (isNaN(dateUTC.getTime())) return "Đang cập nhật...";
        return dateUTC.toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false,
            timeZone: 'Asia/Ho_Chi_Minh'
        });
    } catch (e) { return "Wait..."; }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      <Navbar />
      
      {/* MODAL XEM ẢNH FULL */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full"><X size={32} /></button>
          <img src={selectedImage} alt="Full" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}

      {/* MODAL XÁC NHẬN DUYỆT (ADMIN) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Lock className="text-orange-500" size={24}/> XÁC NHẬN DUYỆT
              </h3>
              <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <p className="text-slate-600 mb-6 font-medium">
              Bạn đang duyệt khoản tiền <span className="font-black text-blue-600 text-lg">{confirmModal.paymentAmount.toLocaleString()}đ</span>.
              <br/>Hành động này không thể hoàn tác.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Mật khẩu Admin</label>
                <input 
                  type="password" 
                  className="w-full p-4 bg-slate-100 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-orange-400 outline-none transition-all"
                  placeholder="Nhập mật khẩu của chú..."
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-all">HỦY BỎ</button>
                <button onClick={handleConfirmApprove} disabled={approving} className="flex-1 py-4 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-50">{approving ? "ĐANG XỬ LÝ..." : "XÁC NHẬN"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <StatsCard stats={stats} />

        {user?.role === 'nephew' ? (
          /* --- GIAO DIỆN CHÁU --- */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3"><Wallet className="text-blue-600" /> Gửi khoản góp mới</h2>
              <div className="space-y-6">
                <input type="number" className="w-full text-5xl font-black p-8 bg-slate-50 rounded-[2rem] outline-none text-blue-600 border-4 border-transparent focus:border-blue-500/10 transition-all" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="0"/>
                <label className={`flex flex-col items-center justify-center py-12 bg-slate-50 border-4 border-dashed rounded-[2rem] cursor-pointer hover:bg-blue-50 transition-all ${file ? 'border-green-400 bg-green-50' : 'border-slate-200'}`}>
                  <Camera size={40} className={file ? 'text-green-500' : 'text-slate-300'}/>
                  <span className="font-bold mt-2 text-slate-400 text-center px-4">{file ? file.name : "Chọn ảnh minh chứng"}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e)=>setFile(e.target.files[0])}/>
                </label>
                <button onClick={handleSubmit} disabled={loading} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-2xl shadow-xl active:scale-95 transition-all">
                  {loading ? "ĐANG GỬI..." : "GỬI NGAY 🚀"}
                </button>
              </div>
            </div>

            <div className="mt-12">
              <h3 className="text-xl font-bold mb-4 text-slate-700">Lịch sử của bạn</h3>
              <div className="space-y-3">
                {myPayments.length === 0 && <p className="text-slate-400 italic">Chưa có giao dịch.</p>}
                {myPayments.map(p => (
                  <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-black text-slate-800 text-lg">{p.amount.toLocaleString()}đ</p>
                      <p className="text-xs text-slate-400 font-medium">{formatDate(p.created_at)}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${p.status ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {p.status ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* --- GIAO DIỆN ÔNG CHÚ (ADMIN) --- */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payments.length === 0 && <p className="col-span-full text-center text-slate-400 italic py-10">Danh sách trống.</p>}
            {payments.map((p) => (
              <div key={p.id} className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${p.status ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {p.status ? 'Đã duyệt' : 'Đang chờ'}
                  </span>
                  <p className="text-slate-400 font-bold text-xs">Từ: <span className="text-slate-700">{p.owner?.username}</span></p>
                </div>
                
                {/* [MỚI] Hiển thị ngày tháng cho Ông Chú */}
                <div className="flex items-center gap-1 text-slate-400 mb-4 pl-1">
                   <Clock size={12} />
                   <p className="text-[10px] font-bold uppercase tracking-wide">{formatDate(p.created_at)}</p>
                </div>

                <p className="text-3xl font-black text-slate-800 mb-4">{p.amount.toLocaleString()}đ</p>
                <div className="aspect-video bg-slate-100 rounded-3xl mb-6 overflow-hidden relative group cursor-pointer" onClick={() => setSelectedImage(p.proof_image_url)}>
                  <img src={p.proof_image_url} alt="proof" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                    <ZoomIn className="text-white" />
                  </div>
                </div>
                {!p.status ? (
                  <button onClick={() => openConfirmModal(p.id, p.amount)} className="w-full py-4 bg-green-500 text-white rounded-2xl font-black hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200">
                    <CheckCircle size={20}/> DUYỆT NGAY
                  </button>
                ) : (
                   <button disabled className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
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
};

export default Dashboard;