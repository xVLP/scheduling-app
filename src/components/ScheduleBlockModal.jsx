import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, BookOpen, AlertTriangle, CheckCircle2, Split, Sparkles, ShieldAlert } from 'lucide-react';
import { validateBlock, timeToMinutes, minutesToTime, formatTime12, getVacantRoomRecommendations } from '../utils/conflictChecker';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const START_TIME_OPTIONS = [
  { value: '07:30', label: '7:30 AM (Morning Session 1)' },
  { value: '08:30', label: '8:30 AM (Morning Session 2)' },
  { value: '09:30', label: '9:30 AM (Morning Session 3)' },
  { value: '10:30', label: '10:30 AM (Morning Session 4)' },
  { value: '11:30', label: '11:30 AM (Midday / Lunch Buffer — Last Option)' },
  { value: '13:00', label: '1:00 PM (Afternoon Session 1)' },
  { value: '14:00', label: '2:00 PM (Afternoon Session 2)' },
  { value: '15:00', label: '3:00 PM (Afternoon Session 3)' },
  { value: '16:00', label: '4:00 PM (Afternoon Session 4)' },
  { value: '17:00', label: '5:00 PM (Past 5 PM — Fallback / Last Option)' },
  { value: '18:00', label: '6:00 PM (Past 5 PM — Fallback / Last Option)' },
  { value: '19:00', label: '7:00 PM (Past 5 PM — Fallback / Last Option)' }
];

export default function ScheduleBlockModal({
  isOpen,
  onClose,
  onSave,
  blockToEdit = null,
  initialDay = 'Monday',
  initialTime = '07:30',
  sections = [],
  subjects = [],
  teachers = [],
  rooms = [],
  existingBlocks = [],
  asynchronousDays = ['Wednesday']
}) {
  const asynchList = Array.isArray(asynchronousDays)
    ? asynchronousDays
    : (asynchronousDays?.asynchronousDays || ['Wednesday']);

  const [mode, setMode] = useState('single'); // 'single' | 'combined'
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [notes, setNotes] = useState('');

  // Single Session Fields
  const [type, setType] = useState('Lecture');
  const [deliveryMode, setDeliveryMode] = useState('Face-to-Face'); // 'Face-to-Face' | 'Asynchronous'
  const [day, setDay] = useState(initialDay);
  const [startTime, setStartTime] = useState(initialTime);
  const [durationHours, setDurationHours] = useState(1);
  const [endTime, setEndTime] = useState('08:30');
  const [roomId, setRoomId] = useState('');

  // Combined Sessions Fields for 2-Hour Lecture (Split: 1h F2F + 1h Asynch + Lab)
  const [lecF2FDay, setLecF2FDay] = useState('Monday');
  const [lecF2FStartTime, setLecF2FStartTime] = useState('07:30');
  const [lecF2FEndTime, setLecF2FEndTime] = useState('08:30');
  const [lecF2FRoomId, setLecF2FRoomId] = useState('');

  const [lecAsynchDay, setLecAsynchDay] = useState(asynchList[0] || 'Wednesday');
  const [lecAsynchStartTime, setLecAsynchStartTime] = useState('07:30');
  const [lecAsynchEndTime, setLecAsynchEndTime] = useState('08:30');

  // Standard Combined Sessions Fields (for non-2hr lecture subjects)
  const [lecDay, setLecDay] = useState('Monday');
  const [lecStartTime, setLecStartTime] = useState('07:30');
  const [lecDuration, setLecDuration] = useState(2);
  const [lecEndTime, setLecEndTime] = useState('09:30');
  const [lecRoomId, setLecRoomId] = useState('');

  const [labDay, setLabDay] = useState('Friday');
  const [labStartTime, setLabStartTime] = useState('07:30');
  const [labDuration, setLabDuration] = useState(3);
  const [labEndTime, setLabEndTime] = useState('10:30');
  const [labRoomId, setLabRoomId] = useState('');

  // Error Alert Banner State
  const [blockedConflictList, setBlockedConflictList] = useState([]);

  // Filtered Room Lists by Designation Type (includes Lecture & Laboratory multipurpose rooms)
  const availableLecRooms = rooms.filter(r => !r.type || r.type === 'Lecture' || r.type === 'AVR' || r.type === 'Lecture & Laboratory' || r.type === 'Both');
  const availableLabRooms = rooms.filter(r => !r.type || r.type === 'Laboratory' || r.type === 'Lecture & Laboratory' || r.type === 'Both');

  // Reset or pre-fill state on open
  useEffect(() => {
    setBlockedConflictList([]);
    const defaultAsynchDay = asynchList[0] || 'Wednesday';

    if (blockToEdit) {
      setMode('single');
      setSectionId(blockToEdit.sectionId || '');
      setSubjectId(blockToEdit.subjectId || '');
      setTeacherId(blockToEdit.teacherId || '');
      setRoomId(blockToEdit.deliveryMode === 'Asynchronous' ? '' : (blockToEdit.roomId || ''));
      setDay(blockToEdit.day || 'Monday');
      setStartTime(blockToEdit.startTime || '07:30');
      setEndTime(blockToEdit.endTime || '08:30');
      const dur = (timeToMinutes(blockToEdit.endTime) - timeToMinutes(blockToEdit.startTime)) / 60;
      setDurationHours(dur > 0 ? dur : 1);
      setType(blockToEdit.type || 'Lecture');
      const isBlockAsynch = blockToEdit.deliveryMode === 'Asynchronous' || asynchList.includes(blockToEdit.day);
      setDeliveryMode(isBlockAsynch ? 'Asynchronous' : 'Face-to-Face');
      setNotes(blockToEdit.notes || '');
    } else {
      const initialSub = subjects[0];
      setSectionId(sections[0]?.id || '');
      setSubjectId(initialSub?.id || '');
      setTeacherId(teachers[0]?.id || '');
      setDay(initialDay || 'Monday');
      setStartTime(initialTime || '07:30');

      const isSub2HrLec = initialSub?.lecHours === 2;
      const initialDur = isSub2HrLec ? 1 : (initialSub?.lecHours || 2);
      setDurationHours(initialDur);
      setEndTime(minutesToTime(timeToMinutes(initialTime || '07:30') + initialDur * 60));

      const initialType = initialSub?.labHours > 0 && initialSub?.lecHours === 0 ? 'Laboratory' : 'Lecture';
      setType(initialType);
      const isInitialDayAsynch = asynchList.includes(initialDay);
      setDeliveryMode(isInitialDayAsynch ? 'Asynchronous' : 'Face-to-Face');
      setNotes('');

      const targetLecR = rooms.find(r => r.id === initialSub?.defaultLecRoomId && (!r.type || r.type === 'Lecture' || r.type === 'AVR' || r.type === 'Lecture & Laboratory' || r.type === 'Both')) || availableLecRooms[0];
      const targetLabR = rooms.find(r => r.id === initialSub?.defaultLabRoomId && (!r.type || r.type === 'Laboratory' || r.type === 'Lecture & Laboratory' || r.type === 'Both')) || availableLabRooms[0];

      setRoomId(isInitialDayAsynch ? '' : (initialType === 'Laboratory' ? (targetLabR?.id || '') : (targetLecR?.id || '')));
      setLecRoomId(targetLecR?.id || '');
      setLabRoomId(targetLabR?.id || '');

      setLecF2FRoomId(targetLecR?.id || '');
      setLecF2FDay('Monday');
      setLecF2FStartTime('07:30');
      setLecF2FEndTime('08:30');

      setLecAsynchDay(defaultAsynchDay);
      setLecAsynchStartTime('07:30');
      setLecAsynchEndTime('08:30');

      setLabDay('Friday');
      setLabStartTime('07:30');
      setLabDuration(initialSub?.labHours || 3);
      setLabEndTime(minutesToTime(timeToMinutes('07:30') + (initialSub?.labHours || 3) * 60));

      if (initialSub?.lecHours > 0 && initialSub?.labHours > 0) {
        setMode('combined');
      } else {
        setMode('single');
      }
    }
  }, [blockToEdit, isOpen, initialDay, initialTime, sections, subjects, teachers, rooms, asynchList]);

  // Recalculate end times
  useEffect(() => {
    const startMins = timeToMinutes(startTime);
    setEndTime(minutesToTime(startMins + durationHours * 60));
  }, [startTime, durationHours]);

  useEffect(() => {
    const lecStartMins = timeToMinutes(lecStartTime);
    setLecEndTime(minutesToTime(lecStartMins + lecDuration * 60));
  }, [lecStartTime, lecDuration]);

  useEffect(() => {
    const startMins = timeToMinutes(lecF2FStartTime);
    setLecF2FEndTime(minutesToTime(startMins + 60));
  }, [lecF2FStartTime]);

  useEffect(() => {
    const startMins = timeToMinutes(lecAsynchStartTime);
    setLecAsynchEndTime(minutesToTime(startMins + 60));
  }, [lecAsynchStartTime]);

  useEffect(() => {
    const labStartMins = timeToMinutes(labStartTime);
    setLabEndTime(minutesToTime(labStartMins + labDuration * 60));
  }, [labStartTime, labDuration]);

  // Auto-fill rooms & default durations when subject changes
  const handleSubjectChange = (newSubId) => {
    setSubjectId(newSubId);
    setBlockedConflictList([]);
    const sub = subjects.find(s => s.id === newSubId);
    if (sub) {
      const hasLec = sub.lecHours > 0;
      const hasLab = sub.labHours > 0;
      const isSub2Hr = sub.lecHours === 2;

      if (hasLec) setLecDuration(sub.lecHours);
      if (hasLab) setLabDuration(sub.labHours);

      // Match designated rooms or fallback to matching designation type
      const defaultLec = rooms.find(r => r.id === sub.defaultLecRoomId) || availableLecRooms[0] || rooms[0];
      const defaultLab = rooms.find(r => r.id === sub.defaultLabRoomId) || availableLabRooms[0] || rooms[0];

      if (defaultLec) {
        setLecRoomId(defaultLec.id);
        setLecF2FRoomId(defaultLec.id);
      }
      if (defaultLab) setLabRoomId(defaultLab.id);

      if (!hasLab) {
        // Lecture Only Subject
        setType('Lecture');
        setMode('single');
        setDurationHours(isSub2Hr ? 1 : (sub.lecHours || 2));
        if (defaultLec) setRoomId(defaultLec.id);
      } else if (!hasLec) {
        // Laboratory Only Subject
        setType('Laboratory');
        setMode('single');
        setDurationHours(sub.labHours || 3);
        if (defaultLab) setRoomId(defaultLab.id);
      } else {
        // Combined Subject (Has both Lec and Lab)
        setMode('combined');
        if (defaultLec) setRoomId(defaultLec.id);
      }

      const assignedProf = teachers.find(t => t.assignedSubjectIds && t.assignedSubjectIds.includes(newSubId));
      if (assignedProf) setTeacherId(assignedProf.id);
    }
  };

  if (!isOpen) return null;

  const currentSubject = subjects.find(s => s.id === subjectId);
  const isTwoHourLec = currentSubject?.lecHours === 2;
  const hasLecAndLab = (currentSubject?.lecHours || 0) > 0 && (currentSubject?.labHours || 0) > 0;

  // Active rooms dropdown list based on current single session type
  const activeSingleRooms = type === 'Laboratory'
    ? availableLabRooms
    : availableLecRooms;

  // Validation for Single Mode
  const candidateSingle = {
    id: blockToEdit?.id || 'temp-single',
    sectionId,
    subjectId,
    teacherId,
    roomId: deliveryMode === 'Asynchronous' ? null : (roomId || null),
    day,
    startTime,
    endTime,
    type,
    deliveryMode,
    notes: notes || `${deliveryMode === 'Asynchronous' ? 'Asynch' : 'F2F'} ${type} (${durationHours}h)`
  };

  // Validation for Combined Mode (2-Hour Lecture Split)
  const candidateLecF2F = {
    id: 'temp-lec-f2f',
    sectionId,
    subjectId,
    teacherId,
    roomId: lecF2FRoomId,
    day: lecF2FDay,
    startTime: lecF2FStartTime,
    endTime: lecF2FEndTime,
    type: 'Lecture',
    deliveryMode: 'Face-to-Face',
    notes: 'Face-to-Face Lecture (1 hr)'
  };

  const candidateLecAsynch = {
    id: 'temp-lec-asynch',
    sectionId,
    subjectId,
    teacherId,
    roomId: null, // Asynchronous sessions strictly have NO room
    day: lecAsynchDay,
    startTime: lecAsynchStartTime,
    endTime: lecAsynchEndTime,
    type: 'Lecture',
    deliveryMode: 'Asynchronous',
    notes: 'Designated Asynchronous Lecture (1 hr)'
  };

  // Validation for Standard Combined Mode
  const candidateLec = {
    id: 'temp-lec',
    sectionId,
    subjectId,
    teacherId,
    roomId: lecRoomId,
    day: lecDay,
    startTime: lecStartTime,
    endTime: lecEndTime,
    type: 'Lecture',
    deliveryMode: 'Face-to-Face',
    notes: 'Lecture Session'
  };

  const candidateLab = {
    id: 'temp-lab',
    sectionId,
    subjectId,
    teacherId,
    roomId: labRoomId,
    day: labDay,
    startTime: labStartTime,
    endTime: labEndTime,
    type: 'Laboratory',
    deliveryMode: 'Face-to-Face',
    notes: 'Laboratory Session'
  };

  // 3-Hour Laboratory Midday Split checks (10:30-12:30 & 1:00-2:00)
  const isSingleSplitLab = type === 'Laboratory' && durationHours === 3 && startTime === '10:30';
  let conflictsSingle = [];
  if (isSingleSplitLab) {
    const singlePart1 = {
      ...candidateSingle, id: 'temp-lab-p1', startTime: '10:30', endTime: '12:30',
      notes: notes || 'Laboratory (Part 1/2: 10:30-12:30, 2h)'
    };
    const singlePart2 = {
      ...candidateSingle, id: 'temp-lab-p2', startTime: '13:00', endTime: '14:00',
      notes: notes || 'Laboratory (Part 2/2: 1:00-2:00, 1h)'
    };
    const c1 = validateBlock(singlePart1, existingBlocks, rooms, teachers, subjects, sections, asynchList);
    const c2 = validateBlock(singlePart2, [...existingBlocks, singlePart1], rooms, teachers, subjects, sections, asynchList);
    conflictsSingle = [...c1, ...c2];
  } else {
    conflictsSingle = validateBlock(candidateSingle, existingBlocks, rooms, teachers, subjects, sections, asynchList);
  }

  const isCombinedSplitLab = labDuration === 3 && labStartTime === '10:30';
  let conflictsLab = [];
  if (isCombinedSplitLab) {
    const labPart1 = {
      ...candidateLab, id: 'temp-lab-p1', startTime: '10:30', endTime: '12:30',
      notes: 'Laboratory (Part 1/2: 10:30-12:30, 2h)'
    };
    const labPart2 = {
      ...candidateLab, id: 'temp-lab-p2', startTime: '13:00', endTime: '14:00',
      notes: 'Laboratory (Part 2/2: 1:00-2:00, 1h)'
    };
    const c1 = validateBlock(labPart1, existingBlocks, rooms, teachers, subjects, sections, asynchList);
    const c2 = validateBlock(labPart2, [...existingBlocks, labPart1], rooms, teachers, subjects, sections, asynchList);
    conflictsLab = [...c1, ...c2];
  } else {
    conflictsLab = validateBlock(candidateLab, existingBlocks, rooms, teachers, subjects, sections, asynchList);
  }

  const conflictsLec = validateBlock(candidateLec, existingBlocks, rooms, teachers, subjects, sections, asynchList);
  const conflictsLecF2F = validateBlock(candidateLecF2F, existingBlocks, rooms, teachers, subjects, sections, asynchList);
  const conflictsLecAsynch = validateBlock(candidateLecAsynch, existingBlocks, rooms, teachers, subjects, sections, asynchList);

  // Combined mode inter-session pedagogical order check (F2F Lecture before Lab)
  const combinedPedagogicalConflicts = [];
  if (mode === 'combined' && hasLecAndLab) {
    const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const lecF2FDayToUse = isTwoHourLec ? lecF2FDay : lecDay;
    const lecF2FStartTimeToUse = isTwoHourLec ? lecF2FStartTime : lecStartTime;
    const lecF2FEndTimeToUse = isTwoHourLec ? lecF2FEndTime : lecEndTime;

    const lecF2FDayIdx = DAYS_ORDER.indexOf(lecF2FDayToUse);
    const labDayIdx = DAYS_ORDER.indexOf(labDay);
    const lecF2FEndM = timeToMinutes(lecF2FEndTimeToUse);
    const labStartM = timeToMinutes(labStartTime);

    const isLabBeforeLec = labDayIdx < lecF2FDayIdx || (labDayIdx === lecF2FDayIdx && labStartM < lecF2FEndM);
    if (isLabBeforeLec) {
      combinedPedagogicalConflicts.push({
        type: 'error',
        category: 'pedagogical_order',
        shortMessage: 'F2F Lecture must precede Laboratory',
        message: `PEDAGOGICAL ORDER POLICY: Face-to-Face Lecture (${lecF2FDayToUse} ${formatTime12(lecF2FStartTimeToUse)}) must precede Laboratory session (${labDay} ${formatTime12(labStartTime)}). Please schedule the Laboratory at a later day or time.`
      });
    }
  }

  const activeConflicts = mode === 'single'
    ? conflictsSingle
    : isTwoHourLec
      ? [...conflictsLecF2F, ...conflictsLecAsynch, ...conflictsLab, ...combinedPedagogicalConflicts]
      : [...conflictsLec, ...conflictsLab, ...combinedPedagogicalConflicts];

  const hasErrors = activeConflicts.some(c => c.type === 'error' || c.category === 'availability' || c.category === 'pedagogical_order' || c.category === 'saturday_preference');

  const handleSubmit = (e) => {
    e.preventDefault();
    setBlockedConflictList([]);

    if (hasErrors) {
      setBlockedConflictList(activeConflicts);
      return;
    }

    if (mode === 'single') {
      if (isSingleSplitLab) {
        const blockPart1 = {
          ...candidateSingle,
          id: blockToEdit?.id || `block-lab-p1-${Date.now()}`,
          startTime: '10:30',
          endTime: '12:30',
          notes: notes || 'Laboratory (Part 1/2: 10:30-12:30, 2h)'
        };
        const blockPart2 = {
          ...candidateSingle,
          id: `block-lab-p2-${Date.now() + 1}`,
          startTime: '13:00',
          endTime: '14:00',
          notes: notes || 'Laboratory (Part 2/2: 1:00-2:00, 1h)'
        };
        onSave([blockPart1, blockPart2]);
        onClose();
        return;
      }
      onSave(candidateSingle);
    } else {
      if (isTwoHourLec) {
        const blocksToSave = [
          { ...candidateLecF2F, id: `block-f2f-${Date.now()}` },
          { ...candidateLecAsynch, id: `block-asynch-${Date.now() + 1}` }
        ];
        if (currentSubject?.labHours > 0) {
          if (isCombinedSplitLab) {
            const labPart1 = {
              ...candidateLab,
              id: `block-lab-p1-${Date.now() + 2}`,
              startTime: '10:30',
              endTime: '12:30',
              notes: 'Laboratory (Part 1/2: 10:30-12:30, 2h)'
            };
            const labPart2 = {
              ...candidateLab,
              id: `block-lab-p2-${Date.now() + 3}`,
              startTime: '13:00',
              endTime: '14:00',
              notes: 'Laboratory (Part 2/2: 1:00-2:00, 1h)'
            };
            blocksToSave.push(labPart1, labPart2);
          } else {
            blocksToSave.push({ ...candidateLab, id: `block-lab-${Date.now() + 2}` });
          }
        }
        onSave(blocksToSave);
      } else {
        const blocksToSave = [];
        if (currentSubject?.lecHours > 0) {
          blocksToSave.push({ ...candidateLec, id: `block-lec-${Date.now()}` });
        }
        if (currentSubject?.labHours > 0) {
          if (isCombinedSplitLab) {
            const labPart1 = {
              ...candidateLab,
              id: `block-lab-p1-${Date.now() + 1}`,
              startTime: '10:30',
              endTime: '12:30',
              notes: 'Laboratory (Part 1/2: 10:30-12:30, 2h)'
            };
            const labPart2 = {
              ...candidateLab,
              id: `block-lab-p2-${Date.now() + 2}`,
              startTime: '13:00',
              endTime: '14:00',
              notes: 'Laboratory (Part 2/2: 1:00-2:00, 1h)'
            };
            blocksToSave.push(labPart1, labPart2);
          } else {
            blocksToSave.push({ ...candidateLab, id: `block-lab-${Date.now() + 1}` });
          }
        }
        onSave(blocksToSave);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-hidden no-print font-poppins">
      <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#064e3b] text-amber-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-emerald-950">
                {blockToEdit ? 'Edit Schedule Block' : 'Schedule Subject Sessions'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">Rooms are strictly restricted to designated Lec vs Lab types</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Toggle Tabs */}
        {!blockToEdit && (
          <div className="mt-4 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 flex space-x-1">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                mode === 'single'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-slate-600 hover:text-emerald-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-800" />
              <span>Single Session Block</span>
            </button>

            {hasLecAndLab ? (
              <button
                type="button"
                onClick={() => setMode('combined')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  mode === 'combined'
                    ? 'bg-[#064e3b] text-white shadow-sm'
                    : 'text-slate-600 hover:text-emerald-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>⚡ Schedule Both Lec & Lab Together</span>
              </button>
            ) : (
              <div className="flex-1 py-2 text-[11px] font-semibold text-slate-400 flex items-center justify-center italic bg-slate-200/50 rounded-lg cursor-not-allowed">
                <span>(Lecture-Only Subject — Combined N/A)</span>
              </div>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="my-3 space-y-4 overflow-y-auto pr-1.5 flex-1 max-h-[65vh]">
          {/* Section & Subject Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Section
              </label>
              <select
                value={sectionId}
                onChange={e => setSectionId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                {sections.map(sec => {
                  const assignedTeacher = teachers.find(
                    t => (t.assignedSectionSubjectPairs || []).some(p => p.subjectId === subjectId && p.sectionId === sec.id)
                  );
                  return (
                    <option key={sec.id} value={sec.id}>
                      {sec.code} - {sec.program} ({sec.studentCount} Students)
                      {assignedTeacher ? ` 🔒 [Assigned: ${assignedTeacher.name}]` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject Code & Title
              </label>
              <select
                value={subjectId}
                onChange={e => handleSubjectChange(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name} ({sub.totalHours}h: {sub.lecHours || 0}h Lec / {sub.labHours || 0}h Lab)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Designated Instructor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Designated Instructor
            </label>
            <select
              value={teacherId}
              onChange={e => setTeacherId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              {teachers.map(t => {
                const tBlocks = existingBlocks.filter(b => b.teacherId === t.id);
                const tSchedHrs = tBlocks.reduce((sum, b) => {
                  const [h1, m1] = b.startTime.split(':').map(Number);
                  const [h2, m2] = b.endTime.split(':').map(Number);
                  return sum + (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
                }, 0);
                
                let tAssignedHrs = 0;
                if (t.assignedSectionSubjectPairs && t.assignedSectionSubjectPairs.length > 0) {
                  t.assignedSectionSubjectPairs.forEach(pair => {
                    const sub = subjects.find(s => s.id === pair.subjectId);
                    if (sub) {
                      tAssignedHrs += Number(sub.totalHours || ((sub.lecHours || 0) + (sub.labHours || 0)) || 0);
                    }
                  });
                } else {
                  const tSubIds = Array.from(new Set(tBlocks.map(b => b.subjectId)));
                  const tAssignedSubs = subjects.filter(s => (t.assignedSubjectIds || []).includes(s.id) || tSubIds.includes(s.id));
                  tAssignedHrs = tAssignedSubs.reduce((sum, s) => sum + (s.totalHours || ((s.lecHours || 0) + (s.labHours || 0)) || 0), 0);
                }

                const rawTHrs = tSchedHrs > 0 ? tSchedHrs : tAssignedHrs;
                const tHrs = Math.round(rawTHrs * 10) / 10;
                const maxH = t.maxHours || 30;

                return (
                  <option key={t.id} value={t.id}>
                    {t.name} [{t.employmentType === 'COS' ? 'COS' : 'Permanent'}] ({t.department}) — {tHrs}/{maxH} hrs/wk
                  </option>
                );
              })}
            </select>
          </div>

          {/* MODE 1: SINGLE SESSION BLOCK */}
          {mode === 'single' && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              {/* Modality Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Modality
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryMode('Face-to-Face');
                      const targetLec = rooms.find(r => r.id === currentSubject?.defaultLecRoomId) || availableLecRooms[0];
                      if (type === 'Lecture' && targetLec) setRoomId(targetLec.id);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      deliveryMode === 'Face-to-Face'
                        ? 'bg-[#064e3b] text-white border-emerald-950 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>🏛️ Face-to-Face (Regular Day)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryMode('Asynchronous');
                      setRoomId('');
                      if (asynchList.length > 0 && !asynchList.includes(day)) {
                        setDay(asynchList[0]);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      deliveryMode === 'Asynchronous'
                        ? 'bg-amber-400 text-emerald-950 border-amber-500 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>⚡ Asynchronous (Online Day)</span>
                  </button>
                </div>
              </div>

              {/* 2-Hour Lecture Policy Notice for Single Mode */}
              {isTwoHourLec && durationHours > 1 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-bold flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span>💡 2-Hour Lecture Policy Reminder</span>
                      <p className="font-medium text-[11px] text-amber-900 mt-0.5">
                        2-hour lecture courses for {currentSubject?.code} must be split: 1 hour Face-to-Face (regular day) and 1 hour Asynchronous ({asynchList.join(', ')}).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDurationHours(1)}
                    className="shrink-0 px-2.5 py-1 text-[11px] font-extrabold bg-amber-400 text-emerald-950 rounded-lg hover:bg-amber-500 shadow-xs cursor-pointer"
                  >
                    Set to 1 Hour
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Session Type
                  </label>
                  <select
                    value={type}
                    onChange={e => {
                      const newType = e.target.value;
                      setType(newType);
                      if (newType === 'Lecture') {
                        const targetLec = rooms.find(r => r.id === currentSubject?.defaultLecRoomId) || availableLecRooms[0];
                        if (targetLec) setRoomId(targetLec.id);
                      } else {
                        const targetLab = rooms.find(r => r.id === currentSubject?.defaultLabRoomId) || availableLabRooms[0];
                        if (targetLab) setRoomId(targetLab.id);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    {currentSubject?.lecHours > 0 && <option value="Lecture">Lecture Session</option>}
                    {currentSubject?.labHours > 0 && <option value="Laboratory">Laboratory Session</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={day}
                    onChange={e => {
                      const selectedDay = e.target.value;
                      setDay(selectedDay);
                      if (asynchList.includes(selectedDay) && type === 'Lecture') {
                        setDeliveryMode('Asynchronous');
                        setRoomId('');
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    {DAYS.map(d => (
                      <option key={d} value={d}>
                        {d} {asynchList.includes(d) ? '⚡ (Asynch Day)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Hours)
                  </label>
                  <select
                    value={durationHours}
                    onChange={e => setDurationHours(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value={1}>1 Hour Session {isTwoHourLec ? '⭐ (Standard Policy)' : ''}</option>
                    <option value={1.5}>1.5 Hours Session</option>
                    <option value={2}>2 Hours Session</option>
                    <option value={3}>3 Hours Session</option>
                    <option value={4}>4 Hours Session</option>
                  </select>
                </div>
              </div>

              {/* Asynchronous Day Warning for Single Lab Mode */}
              {type === 'Laboratory' && asynchList.includes(day) && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-950 font-bold flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-rose-900">🚫 Laboratory Prohibited on Asynchronous Day ({day})</span>
                    <p className="font-medium text-[11px] text-rose-800 mt-0.5">
                      {day} is designated as an Asynchronous Online Learning Day. Face-to-face Laboratory sessions cannot be scheduled on this day. Please select a different day or switch to Lecture.
                    </p>
                  </div>
                </div>
              )}

              {/* Face-to-Face session on Asynch day warning */}
              {deliveryMode === 'Face-to-Face' && asynchList.includes(day) && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-950 font-bold flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-rose-900">🚫 Face-to-Face Session Prohibited on {day} (Asynchronous Day)</span>
                    <p className="font-medium text-[11px] text-rose-800 mt-0.5">
                      {day} is an Asynchronous Online Day. Please move to a regular day or change modality to Asynchronous.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time Slot
                  </label>
                  <select
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    {START_TIME_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value === '10:30' && type === 'Laboratory' && durationHours === 3
                          ? '10:30 AM (🍱 Midday Split: 10:30-12:30 & 1:00-2:00)'
                          : opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Classroom / Room
                  </label>
                  {deliveryMode === 'Asynchronous' ? (
                    <div className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-amber-900 flex items-center space-x-2">
                      <span className="text-base">⚡</span>
                      <div>
                        <div>No Room Assigned (Asynchronous Online Session)</div>
                        <div className="text-[10px] text-amber-700 font-normal">Physical room is not required for asynchronous sessions.</div>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={roomId}
                      onChange={e => setRoomId(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      {activeSingleRooms.map(r => {
                        const allowed = type === 'Laboratory' ? currentSubject?.allowedLabRoomIds : currentSubject?.allowedLecRoomIds;
                        const isFit = allowed && allowed.length > 0 ? allowed.includes(r.id) : true;
                        return (
                          <option key={r.id} value={r.id}>
                            {isFit ? '⭐ ' : ''}{r.name} ({r.type}){isFit ? ' [Approved Fit Room]' : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              </div>

              {/* 3-Hour Midday Split Active Banner */}
              {isSingleSplitLab && (
                <div className="p-3 bg-purple-50 border border-purple-300 rounded-2xl text-xs text-purple-950 font-bold flex items-start space-x-2.5">
                  <span className="text-lg">🍱</span>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-purple-900 font-extrabold">3-Hour Midday Split Laboratory Active</span>
                      <span className="text-[10px] bg-purple-200 text-purple-950 px-2 py-0.5 rounded-full font-black">
                        Part 1: 10:30-12:30 (2h) • Part 2: 1:00-2:00 (1h)
                      </span>
                    </div>
                    <p className="font-medium text-[11px] text-purple-800 mt-0.5">
                      Total 3 hours. Automatically split into two timetable blocks to provide a 30-minute Lunch Break (12:30 PM - 1:00 PM) for students and faculty.
                    </p>
                  </div>
                </div>
              )}

              {/* VACANT ROOM RECOMMENDATIONS (RECOMMENDATION ONLY - DOES NOT AUTOMATICALLY MUTATE SCHEDULE) */}
              {deliveryMode !== 'Asynchronous' && (() => {
                const vacantSingleRecs = getVacantRoomRecommendations(candidateSingle, existingBlocks, rooms, subjects);
                if (vacantSingleRecs.length === 0) return null;
                return (
                  <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-950">
                      <span className="flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>💡 Fully Vacant Rooms for {day} ({formatTime12(startTime)} - {formatTime12(endTime)}):</span>
                      </span>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">Recommendation Only</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {vacantSingleRecs.slice(0, 5).map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRoomId(r.id)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border transition-all flex items-center space-x-1 cursor-pointer ${
                            roomId === r.id
                              ? 'bg-emerald-800 text-white border-emerald-900 shadow-md'
                              : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          <span>📍 {r.name} ({r.type})</span>
                          <span className="text-[9px] bg-emerald-200 text-emerald-950 px-1 rounded font-black">
                            Vacant
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* MODE 2: COMBINED LECTURE + LABORATORY CREATOR */}
          {mode === 'combined' && hasLecAndLab && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              {/* 2-Hour Lecture Policy Banner */}
              {isTwoHourLec && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-950 font-bold">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>⚡ 2-Hour Lecture Policy Applied: 1h Face-to-Face + 1h Asynchronous Online ({asynchList.join(', ')}) + Hands-on Lab</span>
                  </div>
                  <span className="text-[10px] bg-amber-300 text-emerald-950 px-2 py-0.5 rounded-full font-black">
                    Auto-Splitting Active
                  </span>
                </div>
              )}

              {isTwoHourLec ? (
                <>
                  {/* Card 1: Face-to-Face Lecture (1 hr) */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-[#064e3b] text-white font-black text-[10px] rounded-md uppercase">
                        LECTURE 1: FACE-TO-FACE (1 hr)
                      </span>
                      <span className="text-xs text-emerald-900 font-semibold">Regular Day • Lecture Room Only</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Day (Regular)</label>
                        <select
                          value={lecF2FDay}
                          onChange={e => setLecF2FDay(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900"
                        >
                          {DAYS.map(d => (
                            <option key={d} value={d}>
                              {d} {asynchList.includes(d) ? '⚡ (Asynch - No F2F)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Time</label>
                        <select
                          value={lecF2FStartTime}
                          onChange={e => setLecF2FStartTime(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900"
                        >
                          {START_TIME_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Lecture Room Only</label>
                        <select
                          value={lecF2FRoomId}
                          onChange={e => setLecF2FRoomId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900"
                        >
                          {availableLecRooms.map(r => {
                            const allowed = currentSubject?.allowedLecRoomIds;
                            const isFit = allowed && allowed.length > 0 ? allowed.includes(r.id) : true;
                            return (
                              <option key={r.id} value={r.id}>
                                {isFit ? '⭐ ' : ''}{r.name} ({r.type}){isFit ? ' [Approved Fit Room]' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Asynchronous Online Lecture (1 hr) */}
                  <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-amber-500 text-emerald-950 font-black text-[10px] rounded-md uppercase">
                        LECTURE 2: ASYNCHRONOUS ONLINE (1 hr)
                      </span>
                      <span className="text-xs text-amber-900 font-semibold">Designated Asynch Day • LMS / Google Classroom</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Day (Asynchronous)</label>
                        <select
                          value={lecAsynchDay}
                          onChange={e => setLecAsynchDay(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900"
                        >
                          {DAYS.map(d => (
                            <option key={d} value={d}>
                              {d} {asynchList.includes(d) ? '⚡ [Designated Asynch Day]' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Time</label>
                        <select
                          value={lecAsynchStartTime}
                          onChange={e => setLecAsynchStartTime(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900"
                        >
                          {START_TIME_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Room Assignment</label>
                        <div className="w-full bg-amber-100/70 border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                          <span>⚡</span>
                          <span>No Room Assigned (Asynchronous Online)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Standard 1-Card Lecture for non-2hr lecture */
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-[#064e3b] text-white font-black text-[10px] rounded-md uppercase">
                      LECTURE SESSION ({currentSubject.lecHours} hrs)
                    </span>
                    <span className="text-xs text-slate-600 font-semibold">Lecture Rooms Only</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Day</label>
                      <select
                        value={lecDay}
                        onChange={e => setLecDay(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900"
                      >
                        {DAYS.map(d => (<option key={d} value={d}>{d}</option>))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Time</label>
                      <select
                        value={lecStartTime}
                        onChange={e => setLecStartTime(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900"
                      >
                        {START_TIME_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Lecture Room Only</label>
                      <select
                        value={lecRoomId}
                        onChange={e => setLecRoomId(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900"
                      >
                        {availableLecRooms.map(r => {
                          const allowed = currentSubject?.allowedLecRoomIds;
                          const isFit = allowed && allowed.length > 0 ? allowed.includes(r.id) : true;
                          return (
                            <option key={r.id} value={r.id}>
                              {isFit ? '⭐ ' : ''}{r.name} ({r.type}){isFit ? ' [Approved Fit Room]' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Laboratory Section Card */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-purple-700 text-white font-black text-[10px] rounded-md uppercase">
                    LABORATORY SESSION ({currentSubject.labHours} hrs)
                  </span>
                  <span className="text-xs text-slate-600 font-semibold">Laboratory Rooms Only</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Day</label>
                    <select
                      value={labDay}
                      onChange={e => setLabDay(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900"
                    >
                      {DAYS.map(d => (
                        <option key={d} value={d}>
                          {d} {asynchList.includes(d) ? '⚡ (Asynch - No Lab)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Time</label>
                    <select
                      value={labStartTime}
                      onChange={e => setLabStartTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900"
                    >
                      {START_TIME_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.value === '10:30' && (currentSubject?.labHours === 3 || labDuration === 3)
                            ? '10:30 AM (🍱 Midday Split: 10:30-12:30 & 1:00-2:00)'
                            : opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Laboratory Room Only</label>
                    <select
                      value={labRoomId}
                      onChange={e => setLabRoomId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900"
                    >
                      {availableLabRooms.map(r => {
                        const allowed = currentSubject?.allowedLabRoomIds;
                        const isFit = allowed && allowed.length > 0 ? allowed.includes(r.id) : true;
                        return (
                          <option key={r.id} value={r.id}>
                            {isFit ? '⭐ ' : ''}{r.name} ({r.type}){isFit ? ' [Approved Fit Room]' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Combined Mode 3-Hour Split Lab Active Banner */}
                {isCombinedSplitLab && (
                  <div className="p-3 bg-purple-100/90 border border-purple-300 rounded-2xl text-xs text-purple-950 font-bold flex items-start space-x-2.5">
                    <span className="text-lg">🍱</span>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-purple-900 font-extrabold">3-Hour Midday Split Laboratory Active</span>
                        <span className="text-[10px] bg-purple-200 text-purple-950 px-2 py-0.5 rounded-full font-black">
                          Part 1: 10:30-12:30 (2h) • Part 2: 1:00-2:00 (1h)
                        </span>
                      </div>
                      <p className="font-medium text-[11px] text-purple-800 mt-0.5">
                        Total 3 hours. Automatically split into two parts (10:30-12:30 and 1:00-2:00) with a 30-minute Lunch Break in between.
                      </p>
                    </div>
                  </div>
                )}

                {asynchList.includes(labDay) && (
                  <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-xl text-xs text-rose-950 font-bold flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-rose-900">🚫 Laboratory Prohibited on {labDay} (Asynchronous Day)</span>
                      <p className="font-medium text-[11px] text-rose-800 mt-0.5">
                        Please select a different day for the laboratory session. Face-to-face classes are prohibited on Asynchronous days.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STRICT CONFLICT ERROR BANNER */}
          {activeConflicts.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 text-rose-900 font-extrabold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <span>🚫 Schedule Generation Blocked — Conflict Point Out</span>
              </div>
              <p className="text-xs text-rose-800 font-medium">
                The schedule <strong className="text-rose-950 font-bold">CANNOT BE GENERATED / SAVED</strong> because of the following double-booking conflict(s):
              </p>

              <div className="space-y-1.5 pt-1">
                {activeConflicts.map((conf, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-xl border border-rose-200 text-xs text-rose-950 font-semibold shadow-sm flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-rose-900">{conf.category?.toUpperCase() || 'CONFLICT DETECTED'}</strong>
                      <span>{conf.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeConflicts.length === 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center space-x-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero conflicts detected! Safe to save session schedule.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 shrink-0 bg-white sticky bottom-0 mt-2 z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={hasErrors}
              className={`px-5 py-2 text-sm font-bold rounded-xl text-white shadow-md transition-all ${
                hasErrors
                  ? 'bg-slate-400 cursor-not-allowed opacity-75'
                  : 'bg-[#064e3b] hover:bg-emerald-900'
              }`}
            >
              {hasErrors ? '🚫 Cannot Save (Fix Conflicts First)' : mode === 'combined' ? '⚡ Save Both Lec & Lab Together' : blockToEdit ? 'Update Block' : 'Save Schedule Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
