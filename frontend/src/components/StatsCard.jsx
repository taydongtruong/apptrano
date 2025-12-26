import React, { useEffect, useRef } from 'react';
import { TrendingUp, Clock, Target, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';

const StatsCard = ({ stats }) => {
  const isCompleted = stats.percentage >= 100;
  
  // Sử dụng Audio từ các nguồn chuyên nghiệp hơn
  const audioContext = useRef({
    // Tiếng pháo hoa nổ vang (Fireworks)
    firework: new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"), 
    // Nhạc chiến thắng hào hùng (Epic Win)
    victory: new Audio("https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3") 
  });

  useEffect(() => {
    if (isCompleted) {
      const sounds = audioContext.current;
      sounds.firework.volume = 0.5;
      sounds.victory.volume = 0.7;
      sounds.victory.loop = false; // Phát một lần cho trang trọng

      // Bắt đầu nhạc Victory
      sounds.victory.play().catch(e => console.log("Cần tương tác người dùng để phát nhạc"));

      const duration = 30 * 1000; 
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 40, spread: 360, ticks: 100, zIndex: 1000 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          // Fade out nhạc nhẹ nhàng khi kết thúc 30s
          const fadeOut = setInterval(() => {
            if (sounds.victory.volume > 0.05) {
              sounds.victory.volume -= 0.05;
            } else {
              sounds.victory.pause();
              clearInterval(fadeOut);
            }
          }, 200);
          return clearInterval(interval);
        }

        const particleCount = 70 * (timeLeft / duration);
        
        // Phát tiếng pháo nổ mỗi nhịp bắn chính
        sounds.firework.currentTime = 0;
        sounds.firework.play().catch(() => {});

        // Hiệu ứng confetti đa dạng màu sắc Gold/Silver
        confetti({ 
          ...defaults, 
          particleCount, 
          origin: { x: randomInRange(0.1, 0.4), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FFFFFF', '#FDB931']
        });
        
        confetti({ 
          ...defaults, 
          particleCount, 
          origin: { x: randomInRange(0.6, 0.9), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FFFFFF', '#FDB931']
        });

      }, 500); // Tần suất 0.5 giây/lần để âm thanh pháo hoa khớp với thị giác

      return () => {
        clearInterval(interval);
        sounds.victory.pause();
      };
    }
  }, [isCompleted]);

  const getProgressColor = (percent) => {
    if (percent >= 100) return 'bg-gradient-to-r from-yellow-300 to-yellow-500';
    if (percent < 30) return 'bg-orange-400';
    if (percent < 70) return 'bg-blue-400';
    return 'bg-green-400';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 font-sans">
      <div className={`lg:col-span-2 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden transition-all duration-1000 ${isCompleted ? 'bg-gradient-to-br from-gray-900 via-yellow-900 to-black ring-4 ring-yellow-500/50' : 'bg-slate-900'}`}>
        
        <TrendingUp className={`absolute right-[-20px] top-[-20px] w-64 h-64 transition-colors ${isCompleted ? 'text-yellow-500/10' : 'text-white/5'}`} />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-yellow-400 animate-ping' : 'bg-blue-500 animate-pulse'}`}></div>
              <p className="uppercase tracking-[0.2em] text-[10px] font-black text-white/70">
                {isCompleted ? 'CHÚC MỪNG CHIẾN DỊCH HOÀN THÀNH' : 'TIẾN ĐỘ HIỆN TẠI'}
              </p>
            </div>
            {isCompleted && (
              <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-1.5 rounded-full backdrop-blur-md animate-bounce border border-yellow-500/30">
                <PartyPopper size={16} className="text-yellow-400" />
                <span className="text-[10px] font-black tracking-widest text-yellow-100">CHẠM ĐÍCH</span>
              </div>
            )}
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mt-2 tracking-tighter flex items-baseline gap-2 italic">
            {stats.current_total?.toLocaleString()}
            <span className="text-2xl font-light text-white/30">₫</span>
          </h1>

          <div className="mt-10">
            <div className="flex justify-between items-end mb-4">
              <div className="flex flex-col">
                <span className={`text-5xl font-black ${isCompleted ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'text-blue-500'}`}>
                  {stats.percentage}%
                </span>
                <span className="text-[10px] uppercase font-bold text-white/50 tracking-[0.3em]">Success Rate</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest mb-1">Mục tiêu</p>
                <span className="text-2xl font-bold text-white tracking-tight">{stats.total_goal?.toLocaleString()}₫</span>
              </div>
            </div>

            <div className="w-full bg-white/5 h-8 rounded-2xl p-1.5 border border-white/10 relative overflow-hidden backdrop-blur-sm">
              <div 
                className={`h-full rounded-xl transition-all duration-[1500ms] ease-out relative ${getProgressColor(stats.percentage)} ${isCompleted ? 'shadow-[0_0_40px_rgba(234,179,8,0.6)]' : ''}`}
                style={{ width: `${Math.min(stats.percentage, 100)}%` }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-white/60 blur-xl rounded-full"></div>
                <div className="absolute inset-0 opacity-40 bg-[linear-gradient(45deg,rgba(255,255,255,.3)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.3)_50%,rgba(255,255,255,.3)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[move-stripe_3s_linear_infinite]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl flex flex-col justify-between hover:shadow-2xl transition-all group">
        <div>
          <div className="flex items-center gap-3 text-orange-500 mb-6">
            <div className="p-4 bg-orange-50 rounded-3xl group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-inner">
              <Clock size={28} />
            </div>
            <div>
              <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Đang chờ</p>
              <p className="font-bold text-xs text-slate-500">Xác minh</p>
            </div>
          </div>
          <p className="text-5xl font-black text-slate-800 tracking-tighter flex items-baseline gap-1">
            {stats.pending_total?.toLocaleString()}<span className="text-xl font-normal text-slate-300">₫</span>
          </p>
        </div>
        
        <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center relative overflow-hidden">
          <p className="text-slate-500 text-xs leading-relaxed font-bold italic z-10 relative">
            {isCompleted ? "Hành trình vạn dặm đã về đích!" : "Mỗi đồng góp vào là một bước gần hơn."}
          </p>
          <div className="absolute bottom-0 right-0 p-1 opacity-5">
             <Target size={40} />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes move-stripe {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
      `}} />
    </div>
  );
};

export default StatsCard;