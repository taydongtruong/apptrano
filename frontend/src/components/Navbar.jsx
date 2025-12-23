import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-white/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user?.role === 'uncle' ? 'bg-green-500' : 'bg-blue-500'}`}>
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-black text-slate-700 leading-tight">{user?.username}</p>
          <p className="text-xs font-bold text-slate-400 uppercase">
            {user?.role === 'uncle' ? 'Người Duyệt (Admin)' : 'Người Nạp'}
          </p>
        </div>
      </div>
      <button 
        onClick={logout} 
        className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
      >
        <LogOut size={20} />
      </button>
    </div>
  );
};

export default Navbar;