import React, { useState } from 'react';
import { 
  UserCheck, 
  Clock, 
  BookOpen, 
  Printer, 
  Save, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  Filter, 
  Utensils, 
  CheckSquare, 
  Zap, 
  RotateCcw,
  FileText,
  LayoutGrid,
  CalendarCheck,
  Edit3,
  Download
} from 'lucide-react';
import TimetableGrid from './TimetableGrid';
import OfficialFacultyWorkloadDocument from './OfficialFacultyWorkloadDocument';
import TemplateSettingsModal from './TemplateSettingsModal';
import { exportToCSV } from '../utils/exporter';
import { COLLEGE_TIME_SLOTS } from '../utils/conflictChecker';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function InstructorView({
  teachers = [],
  subjects = [],
  rooms = [],
  sections = [],
  blocks = [],
  conflicts = {},
  signatories = [],
  templateSettings = {},
  selectedSemester = '1st Semester',
  asynchronousDays = ['Wednesday'],
  onSaveTeacherAvailability,
  onSaveSignatories,
  onSaveTemplateSettings,
  onResetSignatories
}) {
  const [employmentFilter, setEmploymentFilter] = useState('ALL'); // 'ALL' | 'Permanent' | 'COS'
  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0]?.id || '');
  const [viewMode, setViewMode] = useState('official'); // 'official' | 'grid' | 'availability'
  const [printScope, setPrintScope] = useState('current'); // 'current' | 'all'
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Local availability, Brush Mode & Batch control states
  const [localAvailability, setLocalAvailability] = useState({});
  const [saveMessage, setSaveMessage] = useState('');
  const [activeBrush, setActiveBrush] = useState('unavailable'); // 'unavailable' | 'preferred' | 'available'
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [batchDay, setBatchDay] = useState('ALL');
  const [batchRange, setBatchRange] = useState('ALL_DAY');
  const [batchStatus, setBatchStatus] = useState('unavailable');

  const filteredTeachers = teachers.filter(t => {
    if (employmentFilter !== 'ALL' && t.employmentType !== employmentFilter) {
      return false;
    }
    return true;
  });

  const currentTeacher = filteredTeachers.find(t => t.id === selectedTeacherId) || filteredTeachers[0] || teachers[0];

  // Sync availability state when selected teacher changes
  React.useEffect(() => {
    if (currentTeacher) {
      setLocalAvailability(currentTeacher.availability || {});
    }
  }, [selectedTeacherId, currentTeacher]);

  // Global window mouseup listener to stop drag painting smoothly
  React.useEffect(() => {
    const handleGlobalMouseUp = () => setIsMouseDown(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Helper to paint a cell with active brush
  const paintCell = (day, slotId, targetStatus = activeBrush) => {
    setLocalAvailability(prev => {
      const currentDayObj = prev[day] || {};
      if (currentDayObj[slotId] === targetStatus) return prev;
      return {
        ...prev,
        [day]: {
          ...currentDayObj,
          [slotId]: targetStatus
        }
      };
    });
  };

  const handleCellMouseDown = (day, slotId) => {
    setIsMouseDown(true);
    paintCell(day, slotId);
  };

  const handleCellMouseEnter = (day, slotId) => {
    if (isMouseDown) {
      paintCell(day, slotId);
    }
  };

  // Toggle/Fill Entire Day Column in 1 Click
  const handleToggleWholeDay = (day) => {
    setLocalAvailability(prev => {
      const dayObj = { ...(prev[day] || {}) };
      const nonLunchSlots = COLLEGE_TIME_SLOTS.filter(s => !s.isLunch);
      const allActive = nonLunchSlots.every(s => dayObj[s.id] === activeBrush);
      const targetStatus = allActive ? 'available' : activeBrush;

      nonLunchSlots.forEach(s => {
        dayObj[s.id] = targetStatus;
      });

      return { ...prev, [day]: dayObj };
    });
    setSaveMessage(`Filled ${day} with "${activeBrush.toUpperCase()}"!`);
    setTimeout(() => setSaveMessage(''), 2500);
  };

  // Toggle/Fill Entire Time Slot Row in 1 Click across all days
  const handleToggleWholeRow = (slotId, slotLabel) => {
    setLocalAvailability(prev => {
      const newAvail = { ...prev };
      const allActive = DAYS.every(d => newAvail[d]?.[slotId] === activeBrush);
      const targetStatus = allActive ? 'available' : activeBrush;

      DAYS.forEach(d => {
        newAvail[d] = {
          ...(newAvail[d] || {}),
          [slotId]: targetStatus
        };
      });
      return newAvail;
    });
    setSaveMessage(`Filled time slot "${slotLabel}" across all days with "${activeBrush.toUpperCase()}"!`);
    setTimeout(() => setSaveMessage(''), 2500);
  };

  // Batch Apply Availability Helper (Bulk Select)
  const handleApplyBatch = () => {
    const newAvail = { ...localAvailability };
    const targetDays = batchDay === 'ALL' ? DAYS : [batchDay];

    targetDays.forEach(d => {
      const dayObj = { ...(newAvail[d] || {}) };

      COLLEGE_TIME_SLOTS.forEach(slot => {
        if (slot.isLunch) return;

        let matchesRange = false;
        const slotHour = parseInt(slot.start.split(':')[0]);

        if (batchRange === 'ALL_DAY') {
          matchesRange = true;
        } else if (batchRange === 'MORNING' && slotHour >= 7 && slotHour < 13) {
          matchesRange = true; // 7:30 AM to 12:30 PM
        } else if (batchRange === 'AFTERNOON' && slotHour >= 13 && slotHour < 17) {
          matchesRange = true; // 1:00 PM to 5:00 PM
        } else if (batchRange === 'EVENING' && slotHour >= 17) {
          matchesRange = true; // 5:00 PM onwards
        }

        if (matchesRange) {
          dayObj[slot.id] = batchStatus;
        }
      });

      newAvail[d] = dayObj;
    });

    setLocalAvailability(newAvail);
    setSaveMessage(`Batch applied "${batchStatus.toUpperCase()}" to selected time slots!`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Quick Preset Actions
  const handleQuickPreset = (presetType) => {
    const newAvail = { ...localAvailability };

    if (presetType === 'UNAVAILABLE_WEEKENDS') {
      const dayObj = {};
      COLLEGE_TIME_SLOTS.forEach(s => { if (!s.isLunch) dayObj[s.id] = 'unavailable'; });
      newAvail['Saturday'] = dayObj;
    } else if (presetType === 'PREFERRED_MORNINGS') {
      DAYS.forEach(d => {
        const dayObj = { ...(newAvail[d] || {}) };
        COLLEGE_TIME_SLOTS.forEach(s => {
          if (!s.isLunch && parseInt(s.start.split(':')[0]) < 13) {
            dayObj[s.id] = 'preferred';
          }
        });
        newAvail[d] = dayObj;
      });
    } else if (presetType === 'CLEAR_ALL') {
      DAYS.forEach(d => { newAvail[d] = {}; });
    }

    setLocalAvailability(newAvail);
    setSaveMessage('Preset applied successfully! Click "Save Preferences" to commit.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleSaveAvailability = () => {
    if (currentTeacher) {
      onSaveTeacherAvailability(currentTeacher.id, localAvailability);
      setSaveMessage('Availability preferences saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Calculate instructor load
  const instructorBlocks = blocks.filter(b => b.teacherId === currentTeacher?.id);
  const scheduledSubIds = Array.from(new Set(instructorBlocks.map(b => b.subjectId)));
  
  let assignedUnits = 0;
  let assignedHoursFromPairs = 0;

  if (currentTeacher?.assignedSectionSubjectPairs && currentTeacher.assignedSectionSubjectPairs.length > 0) {
    currentTeacher.assignedSectionSubjectPairs.forEach(pair => {
      const sub = subjects.find(s => s.id === pair.subjectId);
      if (sub) {
        assignedUnits += Number(sub.units || 0);
        assignedHoursFromPairs += Number(sub.totalHours || ((sub.lecHours || 0) + (sub.labHours || 0)) || 0);
      }
    });
  } else {
    const assignedSubList = subjects.filter(s => (currentTeacher?.assignedSubjectIds || []).includes(s.id) || scheduledSubIds.includes(s.id));
    assignedUnits = assignedSubList.reduce((sum, s) => sum + (s.units || 0), 0);
    assignedHoursFromPairs = assignedSubList.reduce((sum, s) => sum + (s.totalHours || ((s.lecHours || 0) + (s.labHours || 0)) || 0), 0);
  }

  const totalScheduledHours = instructorBlocks.reduce((sum, b) => {
    const [h1, m1] = b.startTime.split(':').map(Number);
    const [h2, m2] = b.endTime.split(':').map(Number);
    return sum + (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
  }, 0);

  const displayLoadHours = totalScheduledHours > 0 ? totalScheduledHours : assignedHoursFromPairs;
  const roundedHours = Math.round(displayLoadHours * 10) / 10;
  const maxHrs = currentTeacher?.maxHours || 30;
  const maxUnits = currentTeacher?.maxUnits || 24;
  const isOverloaded = roundedHours > maxHrs;

  const handleExportCSV = () => {
    if (!currentTeacher) return;
    const rows = instructorBlocks.map(b => {
      const sub = subjects.find(s => s.id === b.subjectId);
      const sec = sections.find(s => s.id === b.sectionId);
      const room = rooms.find(r => r.id === b.roomId);
      return {
        Day: b.day,
        StartTime: b.startTime,
        EndTime: b.endTime,
        SubjectCode: sub?.code || '',
        SubjectName: sub?.name || '',
        Section: sec?.code || '',
        Type: b.type,
        Room: room?.name || ''
      };
    });
    exportToCSV(`instructor_schedule_${currentTeacher.name.replace(/\s+/g, '_')}.csv`, rows);
  };

  const handlePrint = (scope = 'current') => {
    setPrintScope(scope);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6 font-poppins">
      {/* Top Banner / Instructor Selector */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xl no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#064e3b] text-amber-400 flex items-center justify-center font-bold">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-emerald-950">Faculty Workload & Instructor Portal</h1>
              <p className="text-xs text-slate-500 font-medium">
                Official CBSUA Faculty Workload (CIT-FR-002) with Printable Landscape Layout, Signatories & Preferences
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Filter Employment Status
              </label>
              <select
                value={employmentFilter}
                onChange={e => {
                  setEmploymentFilter(e.target.value);
                  const firstMatching = teachers.find(t => e.target.value === 'ALL' || t.employmentType === e.target.value);
                  if (firstMatching) setSelectedTeacherId(firstMatching.id);
                }}
                className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
              >
                <option value="ALL">👔 All Employment Statuses</option>
                <option value="Permanent">🏛️ Permanent Faculty</option>
                <option value="COS">📋 COS (Contract of Service)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Select Instructor Profile ({filteredTeachers.length})
              </label>
              <select
                value={selectedTeacherId}
                onChange={e => setSelectedTeacherId(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
              >
                {filteredTeachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} [{t.employmentType === 'COS' ? 'COS' : 'Permanent'}] - {t.department}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center px-3.5 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-all cursor-pointer"
              title="Edit 5 Official Signatories and Header Settings"
            >
              <Edit3 className="w-4 h-4 mr-1.5" />
              Edit Signatories
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 mr-1.5 text-emerald-700" />
              Export CSV
            </button>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handlePrint('current')}
                className="flex items-center px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md transition-all cursor-pointer"
                title="Print current faculty workload on 1 landscape paper"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print Workload ({currentTeacher?.name ? currentTeacher.name.split(' ')[0] : 'Faculty'})
              </button>

              <button
                onClick={() => handlePrint('all')}
                className="flex items-center px-3 py-2 text-xs font-bold text-emerald-950 bg-amber-300 hover:bg-amber-400 rounded-xl shadow-md transition-all cursor-pointer"
                title="Print all faculty workloads (1 landscape paper per faculty)"
              >
                <Printer className="w-4 h-4 mr-1" />
                Print All ({filteredTeachers.length})
              </button>
            </div>
          </div>
        </div>

        {/* Stats Header */}
        {currentTeacher && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
              <span className="text-xs text-slate-500 font-medium">Total Teaching Units</span>
              <div className="text-base font-extrabold text-emerald-950 mt-0.5">
                🎓 {assignedUnits} / {maxUnits} Units
              </div>
            </div>
            <div className={`p-3.5 rounded-xl border ${
              isOverloaded
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-purple-50/50 border-purple-100 text-purple-950'
            }`}>
              <span className="text-xs text-slate-500 font-medium">Total Teaching Load Hours</span>
              <div className="text-base font-extrabold mt-0.5 flex items-center justify-between">
                <span>⏰ {roundedHours} / {maxHrs} Hours / week</span>
                {isOverloaded && (
                  <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md font-black">
                    Overload Limit
                  </span>
                )}
              </div>
            </div>
            <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
              <span className="text-xs text-slate-500 font-medium">Scheduled Sessions</span>
              <div className="text-base font-extrabold text-amber-950 mt-0.5">
                📅 {instructorBlocks.length} Active Sessions
              </div>
            </div>
          </div>
        )}

        {/* Display Mode Pill Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 inline-flex space-x-1">
            <button
              onClick={() => setViewMode('official')}
              className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'official'
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              📜 Official Faculty Workload (CIT-FR-002)
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
              📊 Weekly Schedule Timetable
            </button>

            <button
              onClick={() => setViewMode('availability')}
              className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'availability'
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-900'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              ⏰ Time Availability Preferences
            </button>
          </div>

          <div className="text-xs text-slate-500 font-semibold hidden md:block">
            Official Form: <strong className="text-emerald-950 font-black">CIT-FR-002</strong> (CBSUA Sipocot)
          </div>
        </div>
      </div>

      {/* 1. OFFICIAL FACULTY WORKLOAD DOCUMENT PREVIEW (CIT-FR-002) */}
      {viewMode === 'official' && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 sm:p-6 shadow-xl no-print overflow-x-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-extrabold text-emerald-950 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-emerald-800" />
                Official Faculty Workload Document Preview (CIT-FR-002)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Standard CBSUA College of Information Technology Faculty Workload Form (Landscape). Ready for direct print.
              </p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex items-center px-3.5 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4 mr-1.5" />
                Signatories & Settings
              </button>
              <button
                onClick={() => handlePrint('current')}
                className="flex items-center px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print Workload (Landscape)
              </button>
            </div>
          </div>

          <div className="min-w-[950px] bg-white p-6 border border-slate-300 rounded-xl shadow-inner font-arial">
            <OfficialFacultyWorkloadDocument
              teacher={currentTeacher}
              blocks={blocks}
              subjects={subjects}
              sections={sections}
              rooms={rooms}
              signatories={signatories}
              templateSettings={templateSettings}
              selectedSemester={selectedSemester}
            />
          </div>
        </div>
      )}

      {/* 2. WEEKLY SCHEDULE TIMETABLE GRID */}
      {viewMode === 'grid' && (
        <div className="space-y-3 no-print">
          <h2 className="text-base font-extrabold text-emerald-950 flex items-center px-1">
            <BookOpen className="w-5 h-5 mr-2 text-emerald-800" />
            Weekly Teaching Schedule for {currentTeacher?.name}
          </h2>
          <TimetableGrid
            blocks={blocks}
            subjects={subjects}
            teachers={teachers}
            rooms={rooms}
            sections={sections}
            conflicts={conflicts}
            asynchronousDays={asynchronousDays}
            viewMode="instructor"
            filterId={selectedTeacherId}
          />
        </div>
      )}

      {/* 3. BULK SELECT / PAINT BRUSH AVAILABILITY PREFERENCE CONTROLS */}
      {viewMode === 'availability' && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xl no-print space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-emerald-950 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-amber-500" />
                Instructor Time Availability & Preference Tools
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Paint availability by dragging across cells, or click Day/Time headers to fill an entire column or row in one click.
              </p>
            </div>

            <button
              onClick={handleSaveAvailability}
              className="flex items-center px-4 py-2.5 text-xs font-extrabold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-all self-start sm:self-auto"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save Preferences
            </button>
          </div>

          {/* ACTIVE PAINT BRUSH MODE SELECTOR */}
          <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold text-slate-800 flex items-center shrink-0">
                🎨 Active Paint Mode:
              </span>
              <div className="inline-flex bg-white p-1 rounded-xl border border-slate-300 shadow-sm space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveBrush('unavailable')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center ${
                    activeBrush === 'unavailable'
                      ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-200'
                      : 'text-slate-700 hover:bg-rose-50'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 mr-1.5 inline-block"></span>
                  🔴 Paint Unavailable
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBrush('preferred')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center ${
                    activeBrush === 'preferred'
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200'
                      : 'text-slate-700 hover:bg-emerald-50'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 mr-1.5 inline-block"></span>
                  🟢 Paint Preferred
                </button>

                <button
                  type="button"
                  onClick={() => setActiveBrush('available')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center ${
                    activeBrush === 'available'
                      ? 'bg-slate-800 text-white shadow-sm ring-2 ring-slate-300'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 mr-1.5 inline-block"></span>
                  ⚪ Clear / Available
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 font-semibold bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center">
              <span>💡 <strong>Quick Paint:</strong> Drag over cells to paint, or click any Day / Time Header!</span>
            </div>
          </div>

          {/* Batch Selection Action Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Target Day */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Day(s)</label>
                <select
                  value={batchDay}
                  onChange={e => setBatchDay(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="ALL">All Days (Mon - Sat)</option>
                  {DAYS.map(d => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>

              {/* Time Slot Range */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Time Block Range</label>
                <select
                  value={batchRange}
                  onChange={e => setBatchRange(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="MORNING">Mornings Only (7:30 AM - 12:30 PM)</option>
                  <option value="AFTERNOON">Afternoons Only (1:00 PM - 5:00 PM)</option>
                  <option value="EVENING">Evenings Only (5:00 PM - 8:00 PM)</option>
                  <option value="ALL_DAY">Whole Day (All Hours)</option>
                </select>
              </div>

              {/* Target Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status to Apply</label>
                <select
                  value={batchStatus}
                  onChange={e => setBatchStatus(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="unavailable">🔴 Unavailable (Request Not to Schedule)</option>
                  <option value="preferred">🟢 Preferred (Desired Teaching Time)</option>
                  <option value="available">⚪ Available (Regular Availability)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleApplyBatch}
              className="px-4 py-2 bg-[#064e3b] hover:bg-emerald-900 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center"
            >
              <CheckSquare className="w-4 h-4 mr-1.5 text-amber-400" />
              ⚡ Apply Batch Selection
            </button>
          </div>

          {/* Quick One-Click Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="font-bold text-slate-500 text-[11px] mr-1">Quick Presets:</span>
            
            <button
              onClick={() => handleQuickPreset('UNAVAILABLE_WEEKENDS')}
              className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-900 font-bold rounded-lg hover:bg-rose-100 transition-all text-[11px]"
            >
              🔴 Mark Saturdays Unavailable
            </button>

            <button
              onClick={() => handleQuickPreset('PREFERRED_MORNINGS')}
              className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold rounded-lg hover:bg-emerald-100 transition-all text-[11px]"
            >
              🟢 Mark All Mornings Preferred
            </button>

            <button
              onClick={() => handleQuickPreset('CLEAR_ALL')}
              className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-all text-[11px] flex items-center"
            >
              <RotateCcw className="w-3 h-3 mr-1" /> Reset All to Available
            </button>
          </div>

          {saveMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center space-x-2 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveMessage}</span>
            </div>
          )}

          {/* Availability Grid Table with Header Fill & Drag Painting */}
          <div className="overflow-x-auto pt-2 select-none">
            <table className="w-full border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="bg-[#064e3b] text-white font-bold">
                  <th className="py-2.5 px-3 text-left w-36 border-r border-emerald-800">Time Slot</th>
                  {DAYS.map(day => (
                    <th
                      key={day}
                      onClick={() => handleToggleWholeDay(day)}
                      title={`Click to fill entire ${day} with active brush (${activeBrush.toUpperCase()})`}
                      className="py-2.5 px-3 text-center border-r border-emerald-800 last:border-r-0 cursor-pointer hover:bg-emerald-800 transition-all group relative"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>{day}</span>
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-amber-300 font-black">⚡</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {COLLEGE_TIME_SLOTS.map(slot => {
                  if (slot.isLunch) {
                    return (
                      <tr key={slot.id} className="bg-amber-50 text-amber-900 font-bold">
                        <td className="py-2 px-3 font-mono text-slate-700 bg-amber-100 border-r border-amber-200">
                          {slot.start} - {slot.end}
                        </td>
                        <td colSpan={6} className="py-1.5 text-center text-[10px] uppercase text-amber-800 tracking-wider">
                          Lunch Break (12:30 PM - 1:00 PM)
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={slot.id}>
                      <td
                        onClick={() => handleToggleWholeRow(slot.id, slot.label)}
                        title={`Click to fill time slot "${slot.label}" across all days with active brush (${activeBrush.toUpperCase()})`}
                        className="py-2 px-3 font-mono font-bold text-slate-700 bg-slate-50 hover:bg-emerald-100 cursor-pointer border-r border-slate-200 whitespace-nowrap transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <span>{slot.label}</span>
                          <span className="opacity-0 group-hover:opacity-100 text-[9px] text-emerald-800 font-black">⚡ Fill</span>
                        </div>
                      </td>
                      {DAYS.map(day => {
                        const status = localAvailability[day]?.[slot.id] || 'available';
                        return (
                          <td
                            key={day}
                            onMouseDown={() => handleCellMouseDown(day, slot.id)}
                            onMouseEnter={() => handleCellMouseEnter(day, slot.id)}
                            className={`p-2 text-center border-r border-slate-200 last:border-r-0 cursor-pointer select-none transition-colors ${
                              status === 'preferred'
                                ? 'bg-emerald-600 text-white font-bold border-emerald-700 hover:bg-emerald-700'
                                : status === 'unavailable'
                                ? 'bg-rose-600 text-white font-bold border-rose-700 hover:bg-rose-700'
                                : 'hover:bg-slate-200 text-slate-600 font-medium'
                            }`}
                          >
                            <span className="text-[11px] capitalize">
                              {status}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEDICATED PRINT CONTAINER (Prints only when window.print() is called, 1 landscape paper per faculty) */}
      <div className="hidden print:block font-arial print-container">
        {printScope === 'all' ? (
          filteredTeachers.map(t => (
            <div key={t.id} className="official-print-page">
              <OfficialFacultyWorkloadDocument
                teacher={t}
                blocks={blocks}
                subjects={subjects}
                sections={sections}
                rooms={rooms}
                signatories={signatories}
                templateSettings={templateSettings}
                selectedSemester={selectedSemester}
              />
            </div>
          ))
        ) : (
          <div className="official-print-page">
            <OfficialFacultyWorkloadDocument
              teacher={currentTeacher}
              blocks={blocks}
              subjects={subjects}
              sections={sections}
              rooms={rooms}
              signatories={signatories}
              templateSettings={templateSettings}
              selectedSemester={selectedSemester}
            />
          </div>
        )}
      </div>

      {/* Edit Signatories & Header Modal */}
      <TemplateSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        signatories={signatories}
        templateSettings={templateSettings}
        onSaveSignatories={onSaveSignatories}
        onSaveTemplateSettings={onSaveTemplateSettings}
        onResetSignatories={onResetSignatories}
      />
    </div>
  );
}
