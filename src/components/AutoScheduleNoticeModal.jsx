import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  MapPin, 
  User, 
  BookOpen, 
  ChevronRight, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink,
  Info
} from 'lucide-react';
import { formatTime12 } from '../utils/conflictChecker';

export default function AutoScheduleNoticeModal({
  isOpen,
  onClose,
  reportData,
  onGoToWorkstation,
  sections = [],
  subjects = [],
  teachers = [],
  rooms = []
}) {
  if (!isOpen || !reportData) return null;

  const {
    addedCount = 0,
    fallbackSessions = [],
    unplacedSessions = [],
    blockedConflictReports = [],
    logs = [],
    newBlocks = []
  } = reportData;

  const hasIssues = fallbackSessions.length > 0 || unplacedSessions.length > 0;
  const [activeTab, setActiveTab] = useState(hasIssues ? 'action_needed' : 'all_logs');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-poppins">
      <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`p-5 sm:p-6 border-b flex items-start justify-between ${
          hasIssues 
            ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-white border-amber-200' 
            : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200'
        }`}>
          <div className="flex items-start space-x-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${
              hasIssues ? 'bg-amber-500 text-slate-950' : 'bg-emerald-700 text-amber-300'
            }`}>
              {hasIssues ? <AlertTriangle className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  {hasIssues ? 'Schedule Notice: Sessions Require Review' : 'Schedule Generated Successfully!'}
                </h2>
                {hasIssues && (
                  <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-amber-200 text-amber-950 border border-amber-300">
                    Action Needed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {addedCount} class session(s) successfully scheduled. 
                {fallbackSessions.length > 0 && ` (${fallbackSessions.length} placed in fallback/late slots)`}
                {unplacedSessions.length > 0 && ` (${unplacedSessions.length} require manual assignment in workstation)`}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-white/80 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/80 text-xs font-bold gap-2 pt-2">
          {hasIssues && (
            <button
              onClick={() => setActiveTab('action_needed')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'action_needed'
                  ? 'border-amber-600 text-amber-900 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Action Needed & Fallbacks ({unplacedSessions.length + fallbackSessions.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('all_logs')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'all_logs'
                ? 'border-emerald-700 text-emerald-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>All Scheduled Sessions ({addedCount})</span>
          </button>

          {blockedConflictReports.length > 0 && (
            <button
              onClick={() => setActiveTab('conflicts')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'conflicts'
                  ? 'border-rose-600 text-rose-900 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Detailed Conflicts ({blockedConflictReports.length})</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: ACTION NEEDED (UNPLACED & FALLBACK SESSIONS) */}
          {activeTab === 'action_needed' && (
            <div className="space-y-4">
              {/* Alert Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 flex items-start space-x-3">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold text-amber-900 text-sm">
                    Time Allocation Notice (Priority Rules Enforced):
                  </p>
                  <p className="leading-relaxed">
                    The algorithm strictly avoided the <strong>11:30 AM - 12:30 PM</strong> lunch buffer, slots <strong>past 5:00 PM</strong>, and <strong>Saturday</strong> unless designated as Preferred by the instructor. The sessions below require administrative review or manual placement in the Dean Workstation.
                  </p>
                </div>
              </div>

              {/* 1. UNPLACED SESSIONS */}
              {unplacedSessions.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      Unscheduled Sessions (Standard 7:30 AM - 5:00 PM Slots Full)
                    </h3>
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      {unplacedSessions.length} session(s)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {unplacedSessions.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white border-2 border-rose-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-2.5">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-1 text-xs font-black bg-rose-900 text-white rounded-lg">
                              {item.section?.code || 'Section'}
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              {item.subject?.code} - {item.subject?.name || item.subject?.title}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 self-start sm:self-auto">
                            {item.sessionType} ({item.hours}h)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                          <div className="flex items-center space-x-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Instructor: <strong>{item.teacher?.name || 'Unassigned Instructor'}</strong></span>
                          </div>
                          <div className="text-[11px] text-rose-800 font-semibold italic">
                            ⚠️ {item.reason}
                          </div>
                        </div>

                        {/* Suggested remaining slots */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                          <span className="text-[11px] font-extrabold text-slate-700 block">
                            💡 Available alternative time slots for this room/instructor:
                          </span>
                          {item.remainingSlots && item.remainingSlots.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {item.remainingSlots.map((slot, sIdx) => (
                                <span 
                                  key={sIdx} 
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center space-x-1 ${
                                    slot.isPast5PM
                                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                                      : slot.isLunch
                                        ? 'bg-orange-50 text-orange-900 border-orange-300'
                                        : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                  }`}
                                >
                                  <span>📅 {slot.day} {formatTime12(slot.startTime)} - {formatTime12(slot.endTime)}</span>
                                  <span className="text-[10px] text-slate-500 font-normal">(@ {slot.roomName})</span>
                                  {slot.isPast5PM && <span className="text-[9px] bg-amber-200 text-amber-950 px-1 rounded font-black">Past 5 PM</span>}
                                  {slot.isLunch && <span className="text-[9px] bg-orange-200 text-orange-950 px-1 rounded font-black">Lunch</span>}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500 italic">
                              No vacant regular room or time slot found. You may add a room or adjust in the Dean Workstation.
                            </p>
                          )}
                        </div>

                        {/* CTA button to set in workstation */}
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              if (onGoToWorkstation && item.section?.id) {
                                onGoToWorkstation(item.section.id);
                              }
                            }}
                            className="flex items-center px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-sm transition-all active:scale-95"
                          >
                            <span>Open in Dean Workstation</span>
                            <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. FALLBACK SESSIONS */}
              {fallbackSessions.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Assigned to Fallback Hours (Strict Need / Last Option)
                    </h3>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      {fallbackSessions.length} session(s)
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {fallbackSessions.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-amber-50/50 border border-amber-300 rounded-2xl p-3.5 shadow-sm space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 text-xs font-black bg-amber-800 text-white rounded-md">
                              {item.section?.code}
                            </span>
                            <span className="text-xs font-extrabold text-slate-900">
                              {item.subject?.code} - {item.subject?.name || item.subject?.title}
                            </span>
                          </div>

                          <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase ${
                            item.fallbackReason?.includes('5:00 PM')
                              ? 'bg-amber-200 text-amber-950 border-amber-400'
                              : 'bg-orange-200 text-orange-950 border-orange-400'
                          }`}>
                            ⚠️ {item.fallbackReason}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-700" />
                            <span><strong>{item.day}</strong> ({item.slot?.isSplitMidday ? '10:30 AM - 12:30 PM & 1:00 PM - 2:00 PM (Split)' : `${formatTime12(item.slot?.start)} - ${formatTime12(item.slot?.end)}`})</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-700" />
                            <span>Room: <strong>{item.room?.name || 'Online / Asynchronous'}</strong></span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-3.5 h-3.5 text-amber-700" />
                            <span>Instructor: <strong>{item.teacher?.name}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-amber-900 font-medium pt-1 border-t border-amber-200/80">
                          <span>Scheduled as fallback because standard 7:30 AM - 5:00 PM slots were filled.</span>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              if (onGoToWorkstation && item.section?.id) {
                                onGoToWorkstation(item.section.id);
                              }
                            }}
                            className="font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center"
                          >
                            View in Workstation
                            <ChevronRight className="w-3 h-3 ml-0.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ALL SCHEDULED SESSIONS */}
          {activeTab === 'all_logs' && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-900">Scheduling Summary</h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    All sessions strictly adhere to zero room double-booking, zero section conflict, and zero teacher overlap.
                  </p>
                </div>
                <span className="text-lg font-black text-emerald-950 bg-emerald-200 px-3 py-1 rounded-xl">
                  {addedCount}
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 font-mono text-[11px]">
                {logs.map((log, idx) => (
                  <div 
                    key={idx} 
                    className={`p-1.5 rounded-lg border ${
                      log.includes('[Past 5:00 PM') || log.includes('Lunch Buffer')
                        ? 'bg-amber-50 text-amber-950 border-amber-200 font-bold'
                        : log.startsWith('⚡')
                          ? 'bg-blue-50 text-blue-900 border-blue-200'
                          : log.startsWith('🔬')
                            ? 'bg-purple-50 text-purple-900 border-purple-200'
                            : 'bg-white text-emerald-900 border-emerald-100'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DETAILED CONFLICT REPORTS */}
          {activeTab === 'conflicts' && (
            <div className="space-y-3">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-950 space-y-1">
                <h4 className="font-extrabold text-sm text-rose-900">Unscheduled Session Points (Blocked Constraints):</h4>
                <p className="text-[11px]">
                  The following subjects/sessions could not be auto-scheduled due to lack of available time slots matching institutional policies (7:30 AM - 5:00 PM, Saturday restriction without instructor preference, etc.):
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {blockedConflictReports.map((report, idx) => (
                  <div key={idx} className="bg-white border border-rose-200 rounded-xl p-3 text-xs text-rose-950 font-medium">
                    {report}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Program Chair & Dean Academic Scheduling Workstation
          </span>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all"
            >
              Close Report
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onGoToWorkstation) {
                  onGoToWorkstation(unplacedSessions[0]?.section?.id || null);
                }
              }}
              className="flex items-center px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95"
            >
              <span>Proceed to Dean Workstation</span>
              <ExternalLink className="w-4 h-4 ml-1.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
