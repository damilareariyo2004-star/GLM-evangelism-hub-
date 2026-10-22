import React from 'react';
import { LayoutDashboard, UserPlus, Users } from 'lucide-react';

export type TabType = 'dashboard' | 'add' | 'records';

interface NavigationProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  recordsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onChangeTab,
  recordsCount
}) => {
  return (
    <>
      {/* Desktop Navigation Tabs */}
      <nav className="hidden sm:block bg-white border-b border-slate-200 shadow-xs" aria-label="Main Navigation">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex space-x-1 sm:space-x-4">
            <button
              onClick={() => onChangeTab('dashboard')}
              className={`flex items-center gap-2 py-3.5 px-4 font-bold text-sm border-b-2 transition-colors cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'border-[#E02020] text-[#1E5AA8]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${currentTab === 'dashboard' ? 'text-[#E02020]' : 'text-slate-400'}`} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onChangeTab('add')}
              className={`flex items-center gap-2 py-3.5 px-4 font-bold text-sm border-b-2 transition-colors cursor-pointer ${
                currentTab === 'add'
                  ? 'border-[#E02020] text-[#1E5AA8]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <UserPlus className={`w-4 h-4 ${currentTab === 'add' ? 'text-[#E02020]' : 'text-slate-400'}`} />
              <span>Add Person</span>
              <span className="ml-1 text-[10px] bg-orange-100 text-[#E07F0E] px-1.5 py-0.5 rounded-full font-bold">New</span>
            </button>

            <button
              onClick={() => onChangeTab('records')}
              className={`flex items-center gap-2 py-3.5 px-4 font-bold text-sm border-b-2 transition-colors cursor-pointer ${
                currentTab === 'records'
                  ? 'border-[#E02020] text-[#1E5AA8]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Users className={`w-4 h-4 ${currentTab === 'records' ? 'text-[#E02020]' : 'text-slate-400'}`} />
              <span>Records</span>
              <span className="ml-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                {recordsCount}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Fixed Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5" aria-label="Mobile Navigation">
        <div className="grid grid-cols-3 max-w-md mx-auto">
          <button
            onClick={() => onChangeTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'text-[#1E5AA8] font-bold bg-blue-50/80'
                : 'text-slate-500 font-medium hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 mb-0.5 ${currentTab === 'dashboard' ? 'text-[#E02020]' : 'text-slate-400'}`} />
            <span className="text-[11px]">Dashboard</span>
          </button>

          <button
            onClick={() => onChangeTab('add')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer relative ${
              currentTab === 'add'
                ? 'text-[#1E5AA8] font-bold bg-blue-50/80'
                : 'text-slate-500 font-medium hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <UserPlus className={`w-5 h-5 mb-0.5 ${currentTab === 'add' ? 'text-[#E02020]' : 'text-slate-400'}`} />
              <span className="absolute -top-1 -right-2 w-2 h-2 bg-[#F7931E] rounded-full"></span>
            </div>
            <span className="text-[11px]">Add Person</span>
          </button>

          <button
            onClick={() => onChangeTab('records')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer relative ${
              currentTab === 'records'
                ? 'text-[#1E5AA8] font-bold bg-blue-50/80'
                : 'text-slate-500 font-medium hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <Users className={`w-5 h-5 mb-0.5 ${currentTab === 'records' ? 'text-[#E02020]' : 'text-slate-400'}`} />
              {recordsCount > 0 && (
                <span className="absolute -top-1.5 -right-3 text-[9px] bg-[#1E5AA8] text-white font-bold px-1.5 py-0.2 rounded-full border border-white">
                  {recordsCount}
                </span>
              )}
            </div>
            <span className="text-[11px]">Records</span>
          </button>
        </div>
      </nav>
    </>
  );
};
