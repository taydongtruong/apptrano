import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Target, Plus, CheckCircle, Circle } from 'lucide-react';

const CampaignManager = ({ onUpdateSuccess }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [loading, setLoading] = useState(false);

  // Load danh sách Campaign
  const fetchCampaigns = async () => {
    try {
      const res = await axiosClient.get('/campaigns/');
      setCampaigns(res.data);
    } catch (err) {
      console.error("Lỗi tải campaign:", err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Xử lý tạo mới
  const handleCreate = async () => {
    if (!newTitle || !newTarget) return alert("Vui lòng nhập tên và số tiền!");
    setLoading(true);
    try {
      await axiosClient.post('/campaigns/', {
        title: newTitle,
        target_amount: parseInt(newTarget)
      });
      setNewTitle('');
      setNewTarget('');
      fetchCampaigns(); // Load lại list
      alert("✅ Đã tạo mục tiêu mới!");
    } catch (err) {
      alert("❌ Lỗi khi tạo!");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý kích hoạt (Active)
  const handleActivate = async (id) => {
    try {
      await axiosClient.put(`/campaigns/${id}/activate`);
      fetchCampaigns(); // Load lại list để cập nhật dấu tick xanh
      if (onUpdateSuccess) onUpdateSuccess(); // Báo cho Dashboard load lại Stats
    } catch (err) {
      alert("Lỗi khi kích hoạt!");
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 mb-8">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Target className="text-orange-500" /> QUẢN LÝ MỤC TIÊU
      </h3>

      {/* FORM TẠO MỚI */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-slate-50 p-4 rounded-2xl">
        <input 
          type="text" 
          placeholder="Tên mục tiêu (VD: Mua xe...)" 
          className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-400 font-medium"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input 
          type="number" 
          placeholder="Số tiền (VNĐ)" 
          className="w-full md:w-48 p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-400 font-bold text-slate-700"
          value={newTarget}
          onChange={(e) => setNewTarget(e.target.value)}
        />
        <button 
          onClick={handleCreate} 
          disabled={loading}
          className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} /> {loading ? "..." : "Thêm"}
        </button>
      </div>

      {/* DANH SÁCH */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {campaigns.length === 0 && <p className="text-slate-400 italic text-center">Chưa có mục tiêu nào.</p>}
        
        {campaigns.map((camp) => (
          <div key={camp.id} className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${camp.is_active ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:bg-slate-50'}`}>
            <div>
              <p className={`font-bold ${camp.is_active ? 'text-orange-700' : 'text-slate-700'}`}>{camp.title}</p>
              <p className="text-sm text-slate-500">{camp.target_amount.toLocaleString()} đ</p>
            </div>
            
            {camp.is_active ? (
              <span className="flex items-center gap-1 text-orange-600 font-bold text-xs bg-white px-3 py-1 rounded-full shadow-sm">
                <CheckCircle size={14} /> ĐANG CHẠY
              </span>
            ) : (
              <button 
                onClick={() => handleActivate(camp.id)}
                className="text-slate-400 hover:text-blue-600 transition-colors"
                title="Kích hoạt mục tiêu này"
              >
                <Circle size={24} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampaignManager;