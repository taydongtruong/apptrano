import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import { Target, Plus, ChevronRight } from 'lucide-react';

const CampaignsPage = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');

  const fetchCampaigns = async () => {
    try {
      const res = await axiosClient.get('/campaigns/');
      setCampaigns(res.data);
    } catch (err) {
      console.error("Lỗi:", err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async () => {
    if (!newTitle || !newTarget) return alert("Nhập đủ thông tin đi Chú!");
    try {
      await axiosClient.post('/campaigns/', {
        title: newTitle,
        target_amount: parseInt(newTarget)
      });
      alert("✅ Đã tạo mục tiêu mới!");
      setShowModal(false);
      setNewTitle(''); setNewTarget('');
      fetchCampaigns();
    } catch (err) {
      alert("Lỗi khi tạo!");
    }
  };

  const handleActivate = async (e, id) => {
    e.stopPropagation();
    if(!window.confirm("Kích hoạt mục tiêu này? Các mục tiêu khác sẽ tạm dừng.")) return;
    try {
      await axiosClient.put(`/campaigns/${id}/activate`);
      fetchCampaigns();
    } catch (err) {
      alert("Lỗi kích hoạt");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <Target className="text-orange-500" size={32}/> TỔNG HÀNH DINH
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Chọn một mục tiêu để xem chi tiết.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg">
            <Plus size={20}/> Tạo mới
          </button>
        </div>

        <div className="grid gap-4">
          {campaigns.length === 0 && <p className="text-center text-slate-400 italic py-12">Chưa có kế hoạch nào.</p>}
          {campaigns.map(camp => (
            <div key={camp.id} onClick={() => navigate(`/dashboard/${camp.id}`)} className={`bg-white p-6 rounded-[2rem] border-2 cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all relative ${camp.is_active ? 'border-orange-500 shadow-orange-100' : 'border-slate-100'}`}>
              {camp.is_active && <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-black px-4 py-2 rounded-bl-2xl">ĐANG CHẠY 🚀</div>}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-xl font-black mb-1 ${camp.is_active ? 'text-orange-600' : 'text-slate-700'}`}>{camp.title}</h3>
                  <p className="text-slate-400 font-bold text-sm">Mục tiêu: <span className="text-slate-800 text-lg">{camp.target_amount.toLocaleString()} ₫</span></p>
                </div>
                <div className="flex items-center gap-4">
                  {!camp.is_active && <button onClick={(e) => handleActivate(e, camp.id)} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg font-bold text-xs hover:bg-green-100 hover:text-green-600 z-10">Kích hoạt</button>}
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center"><ChevronRight /></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Thêm kèo mới</h2>
            <input className="w-full p-4 bg-slate-50 rounded-xl mb-4 font-bold outline-none" placeholder="Tên (VD: Mua đất...)" value={newTitle} onChange={e=>setNewTitle(e.target.value)} autoFocus />
            <input className="w-full p-4 bg-slate-50 rounded-xl mb-6 font-bold outline-none" type="number" placeholder="Số tiền (VNĐ)" value={newTarget} onChange={e=>setNewTarget(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={()=>setShowModal(false)} className="flex-1 py-4 bg-slate-100 rounded-xl font-bold text-slate-500">Hủy</button>
              <button onClick={handleCreate} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Tạo ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;