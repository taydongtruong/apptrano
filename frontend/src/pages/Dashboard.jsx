import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import StatsCard from '../components/StatsCard';
import Navbar from '../components/Navbar';
import { Camera, Wallet, CheckCircle, ZoomIn, Lock, Clock } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [stats, setStats] = useState({ current_total: 0, total_goal: 0, percentage: 0, pending_total: 0, campaign_title: "Loading..." });
  const [payments, setPayments] = useState([]); 
  const [myPayments, setMyPayments] = useState([]);
  
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, paymentId: null, paymentAmount: 0 });
  const [adminPass, setAdminPass] = useState('');
  const [approving, setApproving] = useState(false);

  const fetchData = async () => {
    try {
      const params = id ? { params: { campaign_id: id } } : {};
      const statsRes = await axiosClient.get('/stats', params);
      setStats(statsRes.data);

      if (user?.role === 'uncle') {
        const paymentsRes = await axiosClient.get('/admin/payments', params);
        setPayments(paymentsRes.data);
      } else {
        const myRes = await axiosClient.get('/payments/me');
        setMyPayments(myRes.data);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user, id]);

  const handleSubmit = async () => {
    if (!amount || !file) return alert("Nhập thiếu thông tin!");
    setLoading(true);
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('file', file);
    try {
      await axiosClient.post('/payments/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
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
        return isNaN(d.getTime()) ? "..." : d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
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
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Full" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Lock className="text-orange-500"/> XÁC NHẬN DUYỆT <i>{confirmModal.paymentAmount.toLocaleString()}đ</i> <i> !Lưu ý hành động này không thể hoàn tác</i></h3>
            <input type="password" className="w-full p-4 bg-slate-100 rounded-xl font-bold mb-4 outline-none" placeholder="Mật khẩu Admin..." value={adminPass} onChange={(e) => setAdminPass(e.target.value)} autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-500">HỦY</button>
              <button onClick={handleApprove} disabled={approving} className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl shadow-lg">{approving ? "..." : "OK"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <StatsCard stats={stats} />
        {user?.role === 'nephew' ? (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 text-center">
              <h2 className="text-xl font-bold mb-6 flex items-center justify-center gap-2 text-slate-700"><Wallet className="text-blue-600" /> Nạp tiền vào quỹ này</h2>
              <div className="space-y-4">
                <input type="number" className="w-full text-4xl font-black p-6 bg-slate-50 rounded-3xl outline-none text-center text-blue-600 placeholder:text-slate-200" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="0"/>
                <label className={`block py-8 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${file ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <div className="flex flex-col items-center">
                    <Camera className={file ? 'text-green-500' : 'text-slate-300'} />
                    <span className="text-xs font-bold mt-2 text-slate-400">{file ? file.name : "CHỤP ẢNH MINH CHỨNG"}</span>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e)=>setFile(e.target.files[0])}/>
                </label>
                <button onClick={handleSubmit} disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all">
                  {loading ? "ĐANG GỬI..." : "GỬI LUÔN 🚀"}
                </button>
              </div>
            </div>

            {/* --- DANH SÁCH LỊCH SỬ PHÍA CHÁU (NÂNG CẤP) --- */}
            <div className="mt-12">
               <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider text-center flex items-center justify-center gap-2">
                 <Clock size={16}/> Lịch sử đóng góp
               </h3>
               
               <div className="space-y-4">
                 {myPayments.length === 0 && (
                    <div className="text-center py-8 bg-white rounded-3xl border border-dashed border-slate-200">
                      <p className="text-slate-400 italic text-sm">Chưa có giao dịch nào.</p>
                    </div>
                 )}
                 
                 {myPayments.map(p => (
                   <div 
                      key={p.id} 
                      className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md cursor-pointer group"
                      onClick={() => setSelectedImage(p.proof_image_url)}
                   >
                     {/* ẢNH THUMBNAIL */}
                     <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-50 relative">
                        <img src={p.proof_image_url} alt="img" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all flex items-center justify-center">
                          <ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100 transition-all"/>
                        </div>
                     </div>

                     {/* THÔNG TIN */}
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-center mb-1">
                          <p className="font-black text-slate-800 text-lg">{p.amount.toLocaleString()}đ</p>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${p.status ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            {p.status ? 'Đã duyệt' : 'Chờ'}
                          </span>
                       </div>
                       
                       <div className="flex justify-between items-center">
                          <p className="text-xs text-slate-500 font-medium truncate">
                            {p.note || "Góp tiền quỹ"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg">
                            {formatDate(p.created_at)}
                          </p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
             {payments.length === 0 && <div className="col-span-full text-center py-10 text-slate-400 italic">Trống trơn.</div>}
             {payments.map((p) => (
                <div key={p.id} className="bg-white p-5 rounded-[2rem] shadow-lg border border-slate-100 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Từ: <span className="text-slate-800">{p.owner?.username}</span></p><p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Clock size={10}/> {formatDate(p.created_at)}</p></div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.status ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{p.status ? 'ĐÃ DUYỆT' : 'CHỜ BẠN DUYỆT'}</span>
                  </div>
                  <p className="text-2xl font-black text-slate-800 mb-4">{p.amount.toLocaleString()}đ</p>
                  <div className="aspect-video bg-slate-100 rounded-2xl mb-4 overflow-hidden relative group cursor-pointer" onClick={() => setSelectedImage(p.proof_image_url)}>
                    <img src={p.proof_image_url} alt="proof" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><ZoomIn className="text-white"/></div>
                  </div>
                  {!p.status ? <button onClick={() => openConfirmModal(p.id, p.amount)} className="w-full py-3 bg-green-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 text-sm"><CheckCircle size={16}/> DUYỆT</button> 
                  : <button disabled className="w-full py-3 bg-slate-100 text-slate-400 rounded-xl font-bold flex items-center justify-center gap-2 text-sm cursor-not-allowed"><CheckCircle size={16}/> ĐÃ DUYỆT</button>}
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
