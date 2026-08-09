import React from 'react';
import { LayoutDashboard, FilePlus, Truck, Users, Activity, Settings, HelpCircle, Bell } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-blue-600 text-white p-2 rounded-lg">
          <Activity size={24} />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 leading-tight">NeoLife</h2>
          <p className="text-[10px] text-gray-500 font-medium">HOSPITAL SYSTEM</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-blue-600 text-white rounded-lg">
          <LayoutDashboard size={18} />
          <span className="font-medium text-sm">Dashboard</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <FilePlus size={18} />
          <span className="font-medium text-sm">New Request</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <Truck size={18} />
          <span className="font-medium text-sm">Transportations</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <Users size={18} />
          <span className="font-medium text-sm">Patients</span>
        </a>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <Settings size={18} />
          <span className="font-medium text-sm">Settings</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <HelpCircle size={18} />
          <span className="font-medium text-sm">Help & Support</span>
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
