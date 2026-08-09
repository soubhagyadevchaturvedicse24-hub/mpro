import React from 'react';
import { Search, Bell, Plus, ChevronDown } from 'lucide-react';

const Header = ({ onNewRequest }) => {
  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      
      {/* Search Bar */}
      <div className="flex-1 max-w-xl relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input 
          type="text" 
          placeholder="Search patient, transportation, driver..." 
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 bg-white">Ctrl + K</span>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-6 pl-4">
        
        {/* Notifications */}
        <button className="relative text-gray-500 hover:text-gray-700">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            7
          </span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 border-l border-gray-200 pl-6 cursor-pointer">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold overflow-hidden">
            SJ
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-gray-900">Dr. Sarah Jenkins</p>
            <p className="text-xs text-gray-500">Transport Coordinator</p>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </div>

        {/* Primary Action Button */}
        <button 
          onClick={onNewRequest}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm shadow-blue-200"
        >
          <Plus size={18} />
          <span>New Transportation</span>
        </button>

      </div>
    </header>
  );
};

export default Header;
