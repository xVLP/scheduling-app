import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Wand2, 
  Filter, 
  BookOpen, 
  Users, 
  Building2, 
  UserCheck,
  Split,
  Printer,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Layers
} from 'lucide-react';
import TimetableGrid from './TimetableGrid';
import TemplateSettingsModal from './TemplateSettingsModal';
import { exportToCSV } from '../utils/exporter';
import { getVacantRoomRecommendations, formatTime12 } from '../utils/conflictChecker';
import { Zap } from 'lucide-react';

export default function DeanDashboard({
  blocks = [],
  subjects = [],
  teachers = [],
  rooms = [],
  sections = [],
  conflicts = {},
  signatories = [],
  templateSettings = {},
  selectedSemester = '1st Semester',
  selectedYearLevel = 'ALL',
  onAddBlock,
  onEditBlock,
  onDeleteBlock,
  onAutoSchedule,
  onSaveTemplateSettings,
  onSaveSignatories,
  onResetDefault
}) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'section' | 'instructor' | 'room'
  const [filterId, setFilterId] = useState('');
  const [showConflictDrawer, setShowConflictDrawer] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const asynchDays = templateSettings?.asynchronousDays || ['Wednesday'];

  // Total conflict stats
  const conflictBlockIds = Object.keys(conflicts);
  const conflictCount = conflictBlockIds.length;

  // Compute overall schedule summary stats
  const totalScheduledHours = blocks.reduce((acc, b) => {
    const [h1, m1] = b.startTime.split(':').map(Number);
    const [h2, m2] = b.endTime.split(':').map(Number);
    return acc + (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
  }, 0);

  const handleExportMasterCSV = () => {
    const rows = blocks.map(b => {
      const sub = subjects.find(s => s.id === b.subjectId);
      const teacher = teachers.find(t => t.id === b.teacherId);
      const room = rooms.find(r => r.id === b.roomId);
      const sec = sections.find(s => s.id === b.sectionId);
      return {
        Section: sec?.code || '',
        Day: b.day,
        StartTime: b.startTime,
        EndTime: b.endTime,
        SubjectCode: sub?.code || '',
        SubjectName: sub?.name || '',
        Type: b.type,
        Instructor: teacher?.name || '',
        Room: room?.name || ''
      };
    });
    exportToCSV(`cbsua_master_schedule_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-6 font-poppins">
      {/* Top Banner / Dean Controls */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xl no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#064e3b] flex items-center justify-center text-amber-400 shadow-lg shadow-emerald-900/20">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-emerald-950">
                  Program Chair / Dean Workstation
                </h1>
                <span className="px-2.5 py-0.5 text-[11px] font-black bg-emerald-900 text-amber-300 rounded-full border border-emerald-700 shadow-sm">
                  📅 {selectedSemester} {selectedYearLevel !== 'ALL' ? `(Year ${selectedYearLevel})` : ''}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Central Bicol State University of Agriculture - Academic Timetable Management
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center px-4 py-2.5 text-xs font-bold text-emerald-950 bg-amber-300 hover:bg-amber-400 border border-amber-400 rounded-xl shadow-sm transition-all active:scale-95"
              title="Configure Asynchronous Days & Official Template"
            >
              <Zap className="w-4 h-4 mr-1.5 text-amber-800" />
              <span>Asynch: {asynchDays.join(', ') || 'None'}</span>
            </button>

            <button
              onClick={() => onAddBlock('Monday', '07:30')}
              className="flex items-center px-4 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Class Block
            </button>

            <button
              onClick={onAutoSchedule}
              className="flex items-center px-4 py-2.5 text-xs font-extrabold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md active:scale-95"
            >
              <Wand2 className="w-4 h-4 mr-1.5 text-emerald-950" />
              Auto-Scheduler
            </button>

            <button
              onClick={handleExportMasterCSV}
              className="flex items-center px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all"
            >
              Export CSV
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all"
            >
              <Printer className="w-4 h-4 mr-1.5 text-emerald-800" />
              Print Master
            </button>
          </div>
        </div>

        {/* Quick Stats & Conflict Indicator */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
            <span className="text-xs text-slate-500 font-medium">Total Scheduled Blocks</span>
            <div className="text-base font-extrabold text-emerald-900 mt-0.5">{blocks.length} Class Sessions</div>
          </div>

          <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
            <span className="text-xs text-slate-500 font-medium">Total Weekly Load</span>
            <div className="text-base font-extrabold text-emerald-800 mt-0.5">{totalScheduledHours} Hours / Week</div>
          </div>

          <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
            <span className="text-xs text-slate-500 font-medium">Active Sections & Rooms</span>
            <div className="text-base font-extrabold text-slate-800 mt-0.5">
              {sections.length} Sections / {rooms.length} Rooms
            </div>
          </div>

          <div
            onClick={() => setShowConflictDrawer(!showConflictDrawer)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
              conflictCount > 0
                ? 'bg-rose-50 border-rose-300 hover:bg-rose-100 text-rose-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            <div>
              <span className="text-xs font-bold block">Schedule Diagnostics</span>
              <div className="text-sm font-extrabold flex items-center mt-0.5">
                {conflictCount > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-1 text-rose-600 animate-pulse" />
                    {conflictCount} Conflict{conflictCount > 1 ? 's' : ''} Detected
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                    0 Conflicts (Clean)
                  </>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-60" />
          </div>
        </div>
      </div>

      {/* Conflict Diagnostics Drawer */}
      {showConflictDrawer && conflictCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-lg space-y-3 no-print">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-rose-900 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2 text-rose-600" />
              Detailed Conflict Inspector
            </h3>
            <button
              onClick={() => setShowConflictDrawer(false)}
              className="text-xs text-rose-700 hover:text-rose-950 font-bold"
            >
              Dismiss Drawer
            </button>
          </div>

          <div className="space-y-2">
            {conflictBlockIds.map(blockId => {
              const block = blocks.find(b => b.id === blockId);
              const sub = subjects.find(s => s.id === block?.subjectId);
              const sec = sections.find(s => s.id === block?.sectionId);
              const list = conflicts[blockId] || [];

              const vacantRecs = getVacantRoomRecommendations(block, blocks, rooms, subjects);

              return (
                <div key={blockId} className="bg-white p-3.5 rounded-xl border border-rose-300 text-xs shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">
                      📖 {sec?.code} - {sub?.code} ({block?.day} {formatTime12(block?.startTime)} - {formatTime12(block?.endTime)})
                    </span>
                    <button
                      onClick={() => onEditBlock(block)}
                      className="px-2.5 py-1 bg-emerald-800 text-white font-bold text-[10px] rounded-lg hover:bg-emerald-900 transition-all shadow-sm"
                    >
                      Resolve / Edit
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {list.map((c, i) => (
                      <div key={i} className="text-rose-950 text-xs font-semibold flex items-start space-x-2 bg-rose-50 p-2.5 rounded-xl border border-rose-200 shadow-2xs">
                        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${c.type === 'error' ? 'text-rose-600' : 'text-amber-600'}`} />
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 block">
                            {c.category?.replace('_', ' ') || 'Conflict'}
                          </span>
                          <span className="text-slate-800 font-medium text-[11px] leading-relaxed block mt-0.5">
                            {c.message}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ROOM RECOMMENDATION (RECOMMENDATION ONLY - DOES NOT AUTOMATICALLY MUTATE SCHEDULE) */}
                  {vacantRecs.length > 0 ? (
                    <div className="pt-2 border-t border-slate-100 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80 space-y-1.5">
                      <div className="flex items-center space-x-1 text-[11px] font-extrabold text-emerald-950">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>💡 Vacant Room Recommendations for this Time Slot (Recommendation Only):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {vacantRecs.slice(0, 4).map(recRoom => (
                          <button
                            key={recRoom.id}
                            type="button"
                            onClick={() => {
                              // Manually open modal with recommended room pre-selected
                              onEditBlock({ ...block, roomId: recRoom.id });
                            }}
                            className="px-2.5 py-1 text-[10px] font-extrabold bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100 rounded-lg shadow-sm transition-all flex items-center space-x-1"
                            title={`Click to switch ${block?.subjectId ? sub?.code : 'session'} to ${recRoom.name}`}
                          >
                            <span>📍 {recRoom.name} ({recRoom.type})</span>
                            <span className="text-[9px] bg-emerald-200 text-emerald-950 px-1 rounded font-black">
                              Vacant
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1 text-[10px] text-slate-500 italic">
                      ℹ️ No completely vacant matching room found for this exact time slot. Consider changing time slot or day.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timetable Controls & Filter Bar */}
      <div className="bg-white border border-emerald-100 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm no-print">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-emerald-800" />
          <span className="text-xs font-bold text-slate-700">Filter Master Schedule View:</span>
          <select
            value={filterMode}
            onChange={e => {
              setFilterMode(e.target.value);
              setFilterId('');
            }}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">View Entire CBSUA Master Timetable</option>
            <option value="section">Filter by Section</option>
            <option value="instructor">Filter by Instructor</option>
            <option value="room">Filter by Room</option>
          </select>
        </div>

        {filterMode === 'section' && (
          <select
            value={filterId}
            onChange={e => setFilterId(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">-- Select Section --</option>
            {sections.map(s => (
              <option key={s.id} value={s.id}>
                {s.code} ({s.program})
              </option>
            ))}
          </select>
        )}

        {filterMode === 'instructor' && (
          <select
            value={filterId}
            onChange={e => setFilterId(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">-- Select Instructor --</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}

        {filterMode === 'room' && (
          <select
            value={filterId}
            onChange={e => setFilterId(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">-- Select Room --</option>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.type})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Master Interactive Schedule Grid */}
      <TimetableGrid
        blocks={blocks}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
        sections={sections}
        conflicts={conflicts}
        asynchronousDays={asynchDays}
        onCellClick={(day, time) => onAddBlock(day, time)}
        onBlockClick={block => onEditBlock(block)}
        onDeleteBlock={blockId => onDeleteBlock(blockId)}
        viewMode={filterMode === 'all' ? 'master' : filterMode}
        filterId={filterId}
      />

      {/* Official Template & Asynchronous Days Settings Modal */}
      <TemplateSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        signatories={signatories}
        templateSettings={templateSettings}
        onSaveSignatories={onSaveSignatories}
        onSaveTemplateSettings={onSaveTemplateSettings}
        onResetDefault={onResetDefault}
      />
    </div>
  );
}
