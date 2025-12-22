import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Send, Wallet, CheckCircle, TrendingUp, ListChecks, UserCircle, Clock } from 'lucide-react';

function App() {
  const [view, setView] = useState('nephew');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ current_total: 0, total_goal: 45000000, percentage: 0, pending_total: 0 });
  const [payments, setPayments] = useState([]);

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:8000/stats');
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchPayments = async () => {
    try {
      const res = await axios.get('http://localhost:8000/admin/payments');
      setPayments(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchStats();
    if (view === 'uncle') fetchPayments();
  }, [view]);

  const handleSubmit = async () => {
    if (!amount || !file) return alert("Thiếu tiền hoặc ảnh!");
    setLoading(true);
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('file', file);
    try {
      await axios.post('http://localhost:8000/payments/', formData);
      alert("Đã gửi! Chờ ông chú xác nhận để tiền vào tổng nhé.");
      setAmount(''); setFile(null);
      fetchStats();
    } catch (error) { alert("Lỗi!"); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(`http://localhost:8000/admin/approve/${id}`);
      fetchPayments();
      fetchStats();
    } catch (error) { alert("Lỗi!"); }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12">
      {/* Nút chuyển Role */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md shadow-2xl rounded-full p-2 flex gap-2 z-50 border border-white">
        <button onClick={() => setView('nephew')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${view === 'nephew' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500'}`}>
          <UserCircle size={20}/> Cháu
        </button>
        <button onClick={() => setView('uncle')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${view === 'uncle' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'text-slate-500'}`}>
          <ListChecks size={20}/> Ông Chú
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Tiến độ linh hoạt */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-blue-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            <TrendingUp className="absolute right-[-20px] top-[-20px] w-48 h-48 text-white/10" />
            <div className="relative z-10">
              <p className="uppercase tracking-widest text-xs font-black text-blue-200">Tiền đã khớp xác nhận</p>
              <h1 className="text-5xl md:text-7xl font-black mt-2 tracking-tighter">
                {stats.current_total.toLocaleString()}<span className="text-2xl ml-2 font-light text-blue-200">đ</span>
              </h1>
              
              <div className="mt-10">
                <div className="flex justify-between mb-3 text-sm font-bold">
                  <span>Tiến độ: {stats.percentage}%</span>
                  <span>Mục tiêu: 45.000.000đ</span>
                </div>
                <div className="w-full bg-blue-900/30 h-5 rounded-full p-1 border border-white/10">
                  <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${stats.percentage}%` }}></div>
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
            <p className="text-slate-400 text-sm mt-2 font-medium">Khoản này sẽ cộng vào tổng sau khi chú bấm xác nhận.</p>
          </div>
        </div>

        {view === 'nephew' ? (
          /* PHẦN CHÁU GỬI TIỀN */
          <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3"><Wallet className="text-blue-600" size={30}/> Gửi khoản góp mới</h2>
            <div className="space-y-6">
                <input type="number" className="w-full text-5xl font-black p-8 bg-slate-50 rounded-[2rem] outline-none text-blue-600 border-4 border-transparent focus:border-blue-500/10 focus:bg-white transition-all" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="0"/>
                <div className="grid grid-cols-4 gap-3">
                  {[100, 200, 500, 1000].map(v => (
                    <button key={v} onClick={()=>setAmount(v*1000)} className="py-4 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-2xl font-bold text-slate-600 transition-all">{v}k</button>
                  ))}
                </div>
                <label className="flex flex-col items-center justify-center py-12 bg-slate-50 border-4 border-dashed rounded-[2rem] cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group">
                  <Camera size={40} className="text-slate-300 group-hover:text-blue-500 mb-2"/>
                  <span className="font-bold text-slate-400 group-hover:text-blue-600">{file ? "Đã dán ảnh minh chứng ✅" : "Chụp ảnh chuyển khoản"}</span>
                  <input type="file" className="hidden" onChange={(e)=>setFile(e.target.files[0])}/>
                </label>
                <button onClick={handleSubmit} disabled={loading} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all">
                  {loading ? "ĐANG GỬI..." : "GỬI CHO ÔNG CHÚ"}
                </button>
            </div>
          </div>
        ) : (
          /* PHẦN CHÚ DUYỆT TIỀN */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payments.map((p) => (
              <div key={p.id} className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${p.status ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600 animate-pulse'}`}>
                    {p.status ? 'Đã duyệt' : 'Đang chờ'}
                  </span>
                  <p className="text-slate-300 font-bold text-xs italic">#{p.id}</p>
                </div>
                <p className="text-3xl font-black text-slate-800 mb-4">{p.amount.toLocaleString()}đ</p>
                <div className="aspect-video bg-slate-100 rounded-3xl mb-6 overflow-hidden">
                  <img src={`http://localhost:8000/${p.proof_image_url}`} alt="proof" className="w-full h-full object-cover" />
                </div>
                {!p.status && (
                  <button onClick={() => handleApprove(p.id)} className="w-full py-4 bg-green-500 text-white rounded-2xl font-black hover:bg-green-600 shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2">
                    <CheckCircle size={20}/> XÁC NHẬN NHẬN TIỀN
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