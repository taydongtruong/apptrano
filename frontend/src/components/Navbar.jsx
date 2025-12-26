import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Home } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); 
    navigate('/login');
  };

  return (
    <nav className="bg-white px-6 py-4 shadow-sm border-b border-slate-100 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="text-xl font-black text-slate-800 flex items-center gap-2 hover:text-blue-600 transition-colors">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">$</div>
        APAL
      </Link>

      {user && (
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
             <span className="text-sm font-bold text-slate-700">{user.username}</span>
             <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{user.role}</span>
          </div>
          <div className="flex items-center gap-2">
            {user.role === 'uncle' && (
               <Link to="/campaigns" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"><Home size={24} /></Link>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl font-bold transition-all text-sm">
              <LogOut size={18} /> <span className="hidden md:inline">Thoát</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;