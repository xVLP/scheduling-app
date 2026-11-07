import React, { useState } from 'react';
import { 
  Calendar, 
  UserCheck, 
  Building2, 
  Users, 
  Layers, 
  Wand2, 
  RotateCcw, 
  Download, 
  Upload,
  GraduationCap,
  Menu,
  X,
  ChevronRight,
  Sliders,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onAutoSchedule, 
  onResetDemo, 
  onExportBackup, 
  onImportBackup,
  conflictCount,
  selectedSemester = '1st Semester',
  setSelectedSemester,
  selectedYearLevel = 'ALL',
  setSelectedYearLevel,
  lastSavedTime
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImportBackup(file);
      setIsMenuOpen(false);
    }
  };

  const navItems = [
    { id: 'dean', label: 'Dean Workstation', icon: Calendar, badge: conflictCount > 0 ? conflictCount : null },
    { id: 'instructors', label: 'Instructors & Prefs', icon: UserCheck },
    { id: 'sections', label: 'Per Section', icon: Users },
    { id: 'rooms', label: 'Rooms', icon: Building2 },
    { id: 'manage', label: 'Master Data (CRUD)', icon: Layers }
  ];

  const activeNavItem = navItems.find(i => i.id === activeTab) || navItems[0];

  return (
    <header className="bg-[#064e3b] text-white sticky top-0 z-40 shadow-md no-print font-poppins border-b-4 border-amber-400">
      <div className="w-full max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3">
          
          {/* LEFT SIDE: Hamburger Button + Brand Logo & Title */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* BURGER MENU BUTTON (LEFT SIDE ☰) */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center justify-center p-2.5 bg-emerald-950 hover:bg-emerald-900 text-amber-300 border border-emerald-700/80 rounded-xl transition-all shadow-md active:scale-95"
              title="Open Navigation & Tools Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-amber-400 stroke-[2.5]" />}
            </button>

            {/* Brand Logo & Title */}
            <div 
              className="flex items-center space-x-3 cursor-pointer group shrink-0"
              onClick={() => setActiveTab('dean')}
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center shadow-md font-bold group-hover:scale-105 transition-transform">
                <GraduationCap className="w-7 h-7 text-emerald-950" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-extrabold tracking-tight text-white">
                    CBSUA SchedPro
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-black bg-amber-400 text-emerald-950 rounded-full uppercase tracking-wider">
                    College
                  </span>
                </div>
                <p className="text-xs text-emerald-200 font-medium hidden sm:block">
                  Central Bicol State University of Agriculture
                </p>
              </div>
            </div>
          </div>

          {/* CENTER: Active Page Indicator Badge */}
          <div className="hidden md:flex items-center space-x-2 bg-emerald-950/80 px-4 py-2 rounded-2xl border border-emerald-800">
            <activeNavItem.icon className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-extrabold text-white">{activeNavItem.label}</span>
            {activeNavItem.badge && (
              <span className="ml-1.5 px-2 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full">
                {activeNavItem.badge}
              </span>
            )}
          </div>

          {/* RIGHT SIDE: Auto-Save Status, Quick Backup, Active Semester & Auto-Schedule */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Auto-Save Status Badge */}
            <div 
              title={lastSavedTime ? `Auto-saved to localhost database at ${new Date(lastSavedTime).toLocaleTimeString()}` : 'Auto-saved locally in browser (localhost)'}
              className="hidden xl:flex items-center space-x-1.5 bg-emerald-950/80 px-2.5 py-1.5 rounded-xl border border-emerald-800 text-[11px] font-bold text-emerald-300 shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Saved Locally</span>
            </div>

            {/* Quick 1-Click Backup JSON Button */}
            <button
              onClick={onExportBackup}
              title="Download backup file (.json) to protect your schedule before presenting"
              className="hidden lg:flex items-center space-x-1 px-3 py-2 text-xs font-bold text-emerald-100 bg-emerald-900/90 hover:bg-emerald-850 hover:text-white border border-emerald-700/80 rounded-xl transition-all shadow-xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Backup JSON</span>
            </button>

            {/* Active Semester Badge */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-emerald-950/80 px-3 py-2 rounded-xl border border-emerald-800 text-xs font-bold text-amber-300">
              <span>📅 {selectedSemester}</span>
              {selectedYearLevel !== 'ALL' && <span className="text-emerald-200 text-[10px]">({selectedYearLevel} Yr)</span>}
            </div>

            {/* Auto-Schedule Action Button */}
            <button
              onClick={onAutoSchedule}
              title={`Auto-generate schedule for ${selectedSemester}`}
              className="flex items-center px-4 py-2.5 text-xs font-extrabold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
              <Wand2 className="w-4 h-4 mr-1.5 text-emerald-950" />
              <span>Auto-Schedule</span>
            </button>
          </div>

        </div>
      </div>

      {/* HAMBURGER LEFT SLIDE-OVER DRAWER MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden no-print animate-in fade-in duration-150">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
            <div className="w-screen max-w-md bg-[#064e3b] text-white shadow-2xl border-r-4 border-amber-400 flex flex-col justify-between p-6 overflow-y-auto font-poppins">
              
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-emerald-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-bold">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-white">CBSUA SchedPro Menu</h2>
                      <p className="text-[11px] text-emerald-200">System Controls & Timetable Tools</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Academic Context Selectors (Semester & Year Level) */}
                <div className="mt-6 bg-emerald-950/80 p-4 rounded-2xl border border-emerald-800 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                    <Sliders className="w-4 h-4" />
                    <span>Academic Context Controls</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-200 mb-1">Academic Semester</label>
                      <select
                        value={selectedSemester}
                        onChange={e => {
                          setSelectedSemester(e.target.value);
                          setIsMenuOpen(false);
                        }}
                        className="w-full bg-emerald-900 border border-emerald-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
                      >
                        <option value="1st Semester">📅 1st Semester</option>
                        <option value="2nd Semester">📅 2nd Semester</option>
                        <option value="Summer">☀️ Summer / Midyear</option>
                        <option value="ALL">🌐 All Semesters</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-200 mb-1">Year Level Scope</label>
                      <select
                        value={selectedYearLevel}
                        onChange={e => {
                          setSelectedYearLevel(e.target.value);
                          setIsMenuOpen(false);
                        }}
                        className="w-full bg-emerald-900 border border-emerald-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">🎓 All Year Levels</option>
                        <option value="1">1st Year Sections</option>
                        <option value="2">2nd Year Sections</option>
                        <option value="3">3rd Year Sections</option>
                        <option value="4">4th Year Sections</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Drawer Navigation Links */}
                <div className="mt-6 space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block px-2 mb-2">
                    Main Workstations
                  </span>
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-white text-emerald-950 shadow-md font-extrabold'
                            : 'text-emerald-100 hover:bg-emerald-800/90 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-800' : 'text-emerald-300'}`} />
                          <span>{item.label}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          {item.badge && (
                            <span className="px-2 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* System Data Backup & Tools */}
                <div className="mt-6 pt-6 border-t border-emerald-800 space-y-2">
                  <div className="p-3 bg-emerald-950/70 rounded-xl border border-emerald-800/80 text-[11px] text-emerald-200 space-y-1 mb-3">
                    <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Persistent Storage Active</span>
                    </div>
                    <p className="text-[10px] text-emerald-300/80 leading-relaxed">
                      All data entered for Rooms, Subjects, Instructors, and Timetables are automatically persisted to local storage. You can export a JSON backup anytime for archival or presentations.
                    </p>
                  </div>

                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block px-2 mb-1">
                    System Backup & Reset Tools
                  </span>

                  <button
                    onClick={() => {
                      onExportBackup();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-100 hover:bg-emerald-800/80 transition-all border border-emerald-800/60"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Backup Schedule Data (JSON)</span>
                  </button>

                  <label className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-100 hover:bg-emerald-800/80 transition-all border border-emerald-800/60 cursor-pointer">
                    <Upload className="w-4 h-4 text-emerald-300" />
                    <span>Import JSON Backup File</span>
                    <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
                  </label>

                  <button
                    onClick={() => {
                      onResetDemo();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-200 hover:bg-rose-950/60 transition-all border border-rose-800/40"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-400" />
                    <span>Reset to Default Demo Data</span>
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-6 border-t border-emerald-800 text-center">
                <p className="text-[11px] text-emerald-300 font-medium">
                  Central Bicol State University of Agriculture
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </header>
  );
}
