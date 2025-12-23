import React from 'react';
import { TrendingUp, Clock } from 'lucide-react';

const StatsCard = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
      {/* Card Tổng Tiến Độ */}
      <div className="lg:col-span-2 bg-blue-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
        <TrendingUp className="absolute right-[-20px] top-[-20px] w-48 h-48 text-white/10" />
        <div className="relative z-10">
          <p className="uppercase tracking-widest text-xs font-black text-blue-200">Tổng tiền đã xác nhận</p>
          <h1 className="text-5xl md:text-7xl font-black mt-2 tracking-tighter">
            {stats.current_total?.toLocaleString()}<span className="text-2xl ml-2 font-light text-blue-200">đ</span>
          </h1>
          <div className="mt-10">
            <div className="flex justify-between mb-3 text-sm font-bold">
              <span>Tiến độ: {stats.percentage}%</span>
              <span>Mục tiêu: {stats.total_goal?.toLocaleString()}đ</span>
            </div>
            <div className="w-full bg-blue-900/30 h-5 rounded-full p-1 border border-white/10">
              <div 
                className="bg-white h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Chờ Duyệt */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl flex flex-col justify-center">
        <div className="flex items-center gap-3 text-orange-500 mb-2">
          <Clock size={20} />
          <p className="font-bold text-sm uppercase">Đang chờ duyệt</p>
        </div>
        <p className="text-4xl font-black text-slate-800 tracking-tight">
          {stats.pending_total?.toLocaleString()}đ
        </p>
        <p className="text-slate-400 text-sm mt-2 font-medium">Cần Ông Chủ duyệt để cộng vào tổng.</p>
      </div>
    </div>
  );
};

export default StatsCard;