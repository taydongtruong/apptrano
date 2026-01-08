import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import StatsCard from '../components/StatsCard';
import Navbar from '../components/Navbar';
import { Camera, Wallet, CheckCircle, ZoomIn, Lock, Clock, XCircle, Filter } from 'lucide-react';
// Import file tiện ích hiệu ứng mobile
import { playMobileEffect } from '../utils/mobileEffects';

const Dashboard = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [stats, setStats] = useState({ current_total: 0, total_goal: 0, percentage: 0, pending_total: 0, campaign_title: "Loading..." });
  const [payments, setPayments] = useState([]); 
  const [myPayments, setMyPayments] = useState([]);
  
  // --- STATE BỘ LỌC ADMIN (MỚI) ---
  const [filterStatus, setFilterStatus] = useState('all'); // Các giá trị: 'all', 'pending', 'approved'
  
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, paymentId: null, paymentAmount: 0 });
  const [adminPass, setAdminPass] = useState('');
  const [approving, setApproving] = useState(false);

  const formatVisualNumber = (val) => {
    if (!val) return "";
    const number = val.toString().replace(/\D/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const fetchData = async () => {
    try {
      const commonParams = id ? { campaign_id: id } : {};
      const statsRes = await axiosClient.get('/stats', { params: commonParams });
      setStats(statsRes.data);

      if (user?.role === 'uncle') {
        // Gửi kèm trạng thái lọc lên Backend
        const adminParams = { 
            ...commonParams, 
            status_filter: filterStatus !== 'all' ? filterStatus : undefined 
        };
        const paymentsRes = await axiosClient.get('/admin/payments', { params: adminParams });
        setPayments(paymentsRes.data);
      } else {
        const myRes = await axiosClient.get('/payments/me');
        setMyPayments(myRes.data);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // Gọi lại dữ liệu khi filter thay đổi
  useEffect(() => {
    fetchData();
  }, [user, id, filterStatus]);

  useEffect(() => {
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user, id, filterStatus]);

  const handleSubmit = async () => {
    if (!amount || !file) return alert("Nhập thiếu thông tin!");
    setLoading(true);
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('file', file);
    try {
      await axiosClient.post('/payments/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      // --- HIỆU ỨNG MOBILE ---
      // Rung và nói khi gửi thành công
      playMobileEffect(`Đã gửi thành công ${amount.toLocaleString()} đồng. Chờ duyệt nhé!`);
      
      alert("Đã gửi! Chờ duyệt nhé.");
      setAmount(''); setFile(null);
      fetchData();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.detail || "Không gửi được"));
    } finally { setLoading(false); }
  };

  const openConfirmModal = (pid, amt) => {
    setConfirmModal({ isOpen: true, paymentId: pid, paymentAmount: amt });
    setAdminPass(''); 
  };

  const handleApprove = async () => {
    if (!adminPass) return alert("Nhập pass đi chú!");
    setApproving(true);
    try {
      await axiosClient.put(`/payments/${confirmModal.paymentId}/approve`, { password: adminPass });
      
      // --- HIỆU ỨNG MOBILE ---
      // Rung và nói khi duyệt tiền thành công
      playMobileEffect(`Đã duyệt thành công khoản tiền ${confirmModal.paymentAmount.toLocaleString()} đồng!`);

      alert("✅ Đã duyệt!");
      setConfirmModal({ isOpen: false, paymentId: null, paymentAmount: 0 });
      fetchData(); 
    } catch (err) {
      alert("❌ " + (err.response?.data?.detail || "Sai mật khẩu"));
    } finally { setApproving(false); }
  };

  const formatDate = (dateString) => {
    try {
        const d = new Date(dateString.replace(' ', 'T') + 'Z');
        return isNaN(d.getTime()) ? "..." : d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) { return "..."; }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2 text-center">
         <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">CHIẾN DỊCH</h2>
         <h1 className="text-2xl font-black text-slate-800">{stats.campaign_title}</h1>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 cursor-zoom-out" onClick={() => setSelectedImage(null)}>
          <button className="self-end mb-4 text-white flex items-center gap-2 font-bold bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all">
            <XCircle size={20}/> Đóng
          </button>
          <img src={selectedImage} alt="Full Proof" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" />
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Lock className="text-orange-500"/> XÁC NHẬN DUYỆT</h3>
            <p className="text-slate-500 font-medium mb-6">
              Bạn đang duyệt khoản: <span className="text-blue-600 font-black">{confirmModal.paymentAmount.toLocaleString()}₫</span>. Kiểm tra kỹ ảnh trước khi Xác nhận!
            </p>
            <input type="password" className="w-full p-4 bg-slate-100 rounded-2xl font-bold mb-4 outline-none border-2 border-transparent focus:border-orange-500 transition-all" placeholder="Mật khẩu Admin..." value={adminPass} onChange={(e) => setAdminPass(e.target.value)} autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-1 py-4 bg-slate-100 font-bold rounded-2xl text-slate-500">HỦY</button>
              <button onClick={handleApprove} disabled={approving} className="flex-1 py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all">
                {approving ? "..." : "XÁC NHẬN"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <StatsCard stats={stats} />

        {user?.role === 'nephew' ? (
          /* GIAO DIỆN CHÁU */
          <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 text-center">
              <h2 className="text-xl font-bold mb-6 flex items-center justify-center gap-2 text-slate-700"><Wallet className="text-blue-600" /> Nạp tiền vào quỹ</h2>
              <div className="space-y-4">
                <div className="relative group">
                  <input type="text" className="w-full text-4xl font-black p-6 bg-slate-50 rounded-3xl outline-none text-center text-blue-600 placeholder:text-slate-200 border-2 border-transparent focus:border-blue-100 transition-all" value={formatVisualNumber(amount)} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="0" />
                  {amount && <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xl font-black text-blue-300">₫</span>}
                </div>
                <label className={`block py-8 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${file ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <div className="flex flex-col items-center">
                    <Camera className={file ? 'text-green-500' : 'text-slate-300'} size={32} />
                    <span className="text-xs font-bold mt-2 text-slate-400 uppercase">{file ? file.name : "CHỤP ẢNH MINH CHỨNG"}</span>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e)=>setFile(e.target.files[0])}/>
                </label>
                <button onClick={handleSubmit} disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all disabled:bg-slate-300">
                  {loading ? "ĐANG GỬI..." : "GỬI LUÔN 🚀"}
                </button>
              </div>
            </div>
            
            <div className="mt-12">
               <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider text-center flex items-center justify-center gap-2"><Clock size={16}/> Lịch sử đóng góp</h3>
               <div className="space-y-4">
                 {myPayments.length === 0 && <div className="text-center py-8 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 italic text-sm">Chưa có giao dịch.</div>}
                 {myPayments.map(p => (
                   <div key={p.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md cursor-pointer group" onClick={() => setSelectedImage(p.proof_image_url)}>
                     <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-50 relative">
                        <img src={p.proof_image_url} alt="img" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all flex items-center justify-center"><ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100"/></div>
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-center mb-1">
                          <p className="font-black text-slate-800 text-lg">{p.amount.toLocaleString()}₫</p>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${p.status ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{p.status ? 'Đã duyệt' : 'Chờ'}</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] font-bold">
                          <p className="text-slate-400 truncate">{p.note || "Góp tiền quỹ"}</p>
                          <p className="text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{formatDate(p.created_at)}</p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        ) : (
          /* GIAO DIỆN ADMIN (ÔNG CHÚ) - NÂNG CẤP BỘ LỌC */
          <div className="mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400"><Filter size={20}/></div>
                  <h3 className="font-black text-slate-700 uppercase tracking-widest text-sm">Quản lý đóng góp</h3>
               </div>
               
               {/* THANH TAB LỌC */}
               <div className="bg-white p-1.5 rounded-2xl shadow-sm flex border border-slate-100">
                  <button 
                    onClick={() => setFilterStatus('all')}
                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${filterStatus === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    TẤT CẢ
                  </button>
                  <button 
                    onClick={() => setFilterStatus('pending')}
                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${filterStatus === 'pending' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-orange-500'}`}
                  >
                    CHỜ DUYỆT ⏳
                  </button>
                  <button 
                    onClick={() => setFilterStatus('approved')}
                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${filterStatus === 'approved' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-green-600'}`}
                  >
                    ĐÃ XONG ✅
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {payments.length === 0 && <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold italic">Không có giao dịch nào trong mục này.</div>}
               {payments.map((p) => (
                  <div key={p.id} className="bg-white p-5 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Từ: <span className="text-slate-800">{p.owner?.username}</span></p>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Clock size={10}/> {formatDate(p.created_at)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.status ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{p.status ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'}</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 mb-4">{p.amount.toLocaleString()}₫</p>
                    <div className="aspect-video bg-slate-100 rounded-2xl mb-4 overflow-hidden relative cursor-pointer" onClick={() => setSelectedImage(p.proof_image_url)}>
                      <img src={p.proof_image_url} alt="proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><ZoomIn className="text-white"/></div>
                    </div>
                    {!p.status ? (
                      <button onClick={() => openConfirmModal(p.id, p.amount)} className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                        <CheckCircle size={18}/> DUYỆT NGAY
                      </button>
                    ) : (
                      <button disabled className="w-full py-4 bg-slate-50 text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                        <CheckCircle size={18}/> ĐÃ XONG
                      </button>
                    )}
                  </div>
               ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;