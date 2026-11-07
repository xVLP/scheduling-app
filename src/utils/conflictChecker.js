export const COLLEGE_TIME_SLOTS = [
  { id: 't-730', label: '7:30 AM - 8:30 AM', start: '07:30', end: '08:30', isLunch: false },
  { id: 't-830', label: '8:30 AM - 9:30 AM', start: '08:30', end: '09:30', isLunch: false },
  { id: 't-930', label: '9:30 AM - 10:30 AM', start: '09:30', end: '10:30', isLunch: false },
  { id: 't-1030', label: '10:30 AM - 11:30 AM', start: '10:30', end: '11:30', isLunch: false },
  { id: 't-1130', label: '11:30 AM - 12:30 PM', start: '11:30', end: '12:30', isLunch: false },
  { id: 't-lunch', label: '12:30 PM - 1:00 PM (LUNCH BREAK)', start: '12:30', end: '13:00', isLunch: true },
  { id: 't-100', label: '1:00 PM - 2:00 PM', start: '13:00', end: '14:00', isLunch: false },
  { id: 't-200', label: '2:00 PM - 3:00 PM', start: '14:00', end: '15:00', isLunch: false },
  { id: 't-300', label: '3:00 PM - 4:00 PM', start: '15:00', end: '16:00', isLunch: false },
  { id: 't-400', label: '4:00 PM - 5:00 PM', start: '16:00', end: '17:00', isLunch: false },
  { id: 't-500', label: '5:00 PM - 6:00 PM', start: '17:00', end: '18:00', isLunch: false },
  { id: 't-600', label: '6:00 PM - 7:00 PM', start: '18:00', end: '19:00', isLunch: false },
  { id: 't-700', label: '7:00 PM - 8:00 PM', start: '19:00', end: '20:00', isLunch: false }
];

export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const formatTime12 = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

export const doTimesOverlap = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
};

export const validateBlock = (
  candidateBlock,
  existingBlocks,
  rooms,
  teachers,
  subjects,
  sections,
  asynchronousDays = ['Wednesday']
) => {
  const conflicts = [];
  const room = rooms.find(r => r.id === candidateBlock.roomId);
  const teacher = teachers.find(t => t.id === candidateBlock.teacherId);
  const subject = subjects.find(s => s.id === candidateBlock.subjectId);
  const section = sections.find(s => s.id === candidateBlock.sectionId);

  const asynchList = Array.isArray(asynchronousDays)
    ? asynchronousDays
    : (asynchronousDays?.asynchronousDays || ['Wednesday']);

  // 0. Asynchronous Day Check (Strict: Face-to-face Laboratory sessions prohibited on Asynchronous Days)
  if (candidateBlock.type === 'Laboratory' && candidateBlock.day && asynchList.includes(candidateBlock.day)) {
    conflicts.push({
      type: 'error',
      category: 'asynchronous_day',
      shortMessage: `Laboratory not allowed on Asynch Day (${candidateBlock.day})`,
      message: `ASYNCHRONOUS DAY CONFLICT: Laboratory schedules are prohibited on ${candidateBlock.day}. ${candidateBlock.day} is an official Asynchronous Online Learning Day.`
    });
  }

  // 0.1 Face-to-face sessions prohibited on Asynchronous Days
  if (candidateBlock.deliveryMode === 'Face-to-Face' && candidateBlock.day && asynchList.includes(candidateBlock.day)) {
    conflicts.push({
      type: 'error',
      category: 'asynchronous_day',
      shortMessage: `Face-to-Face not allowed on Asynch Day (${candidateBlock.day})`,
      message: `ASYNCHRONOUS DAY CONFLICT: Face-to-Face sessions are prohibited on ${candidateBlock.day}. ${candidateBlock.day} is reserved for Asynchronous Online Learning.`
    });
  }

  // 0.2 Policy Check for 2-hour Lecture subjects (1h F2F + 1h Asynch)
  if (subject && subject.lecHours === 2 && candidateBlock.type === 'Lecture') {
    const blockDuration = (timeToMinutes(candidateBlock.endTime) - timeToMinutes(candidateBlock.startTime)) / 60;
    if (blockDuration > 1) {
      conflicts.push({
        type: 'warning',
        category: 'lecture_split',
        shortMessage: '2-Hr Lecture Must Split (1h F2F + 1h Asynch)',
        message: `2-HOUR LECTURE POLICY: 2-hour lecture courses for ${subject.code} must be split into 1 hour Face-to-Face (regular day) and 1 hour Asynchronous (designated Asynch Day: ${asynchList.join(', ') || 'Wednesday'}).`
      });
    }
  }

  // 0.3 Lunch / Midday Buffer Priority Warning (Avoid 11:30 AM - 12:30 PM unless no other slot)
  if (candidateBlock.startTime && candidateBlock.endTime) {
    const sMin = timeToMinutes(candidateBlock.startTime);
    const eMin = timeToMinutes(candidateBlock.endTime);
    // 11:30 is 690 mins, 12:30 is 750 mins
    if (sMin < 750 && eMin > 690) {
      conflicts.push({
        type: 'warning',
        category: 'lunch_buffer',
        shortMessage: '11:30-12:30 Lunch Buffer (Use as Last Option)',
        message: `LUNCH / MIDDAY BUFFER: Class session occupies the 11:30 AM - 12:30 PM buffer slot. Keep this slot vacant unless no alternative time slot is available.`
      });
    }

    // 0.35 Institutional Lunch Break Overlap Warning (12:30 PM - 1:00 PM)
    if (doTimesOverlap(candidateBlock.startTime, candidateBlock.endTime, '12:30', '13:00')) {
      conflicts.push({
        type: 'warning',
        category: 'lunch_break_overlap',
        shortMessage: 'Overlaps 12:30-1:00 Lunch Break',
        message: `LUNCH BREAK NOTICE: Session overlaps the 12:30 PM - 1:00 PM Lunch Break. For a 3-hour laboratory starting at 10:30 AM, split into 10:30-12:30 (2h) and 1:00-2:00 PM (1h).`
      });
    }
  }

  // 0.4 Pedagogical Order: Face-to-Face Lecture must precede Laboratory session for this specific subject
  if (subject && (subject.lecHours || 0) > 0 && (subject.labHours || 0) > 0 && candidateBlock.day) {
    const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const candDayIdx = DAYS_ORDER.indexOf(candidateBlock.day);
    const candStartM = timeToMinutes(candidateBlock.startTime);
    const candEndM = timeToMinutes(candidateBlock.endTime);

    if (candidateBlock.type === 'Laboratory') {
      const existingF2FLec = existingBlocks.find(b =>
        b.id !== candidateBlock.id &&
        b.sectionId === candidateBlock.sectionId &&
        b.subjectId === candidateBlock.subjectId &&
        b.type === 'Lecture' &&
        b.deliveryMode !== 'Asynchronous' &&
        !asynchList.includes(b.day)
      );

      if (existingF2FLec) {
        const lecF2FDayIdx = DAYS_ORDER.indexOf(existingF2FLec.day);
        const lecF2FEndM = timeToMinutes(existingF2FLec.endTime);

        // Same day violation: Lab starts before Lecture ends on the same day -> STRICT ERROR
        if (candDayIdx === lecF2FDayIdx && candStartM < lecF2FEndM) {
          conflicts.push({
            type: 'error',
            category: 'pedagogical_order',
            conflictingBlockId: existingF2FLec.id,
            shortMessage: 'F2F Lecture must precede Lab on the same day',
            message: `PEDAGOGICAL ORDER CONFLICT: On the same day (${candidateBlock.day}), the Face-to-Face Lecture (${formatTime12(existingF2FLec.startTime)} - ${formatTime12(existingF2FLec.endTime)}) must conclude before the Laboratory session for ${subject.code}.`
          });
        } else if (candDayIdx < lecF2FDayIdx) {
          // Different day: Day of Lab is earlier in the week than Lecture -> WARNING
          conflicts.push({
            type: 'warning',
            category: 'pedagogical_order',
            conflictingBlockId: existingF2FLec.id,
            shortMessage: 'F2F Lecture should precede Lab earlier in the week',
            message: `PEDAGOGICAL ORDER NOTICE: Face-to-Face Lecture for ${subject.code} is scheduled on ${existingF2FLec.day}, while Laboratory is on an earlier day (${candidateBlock.day}). Lecture should precede Laboratory for this subject.`
          });
        }
      }
    } else if (candidateBlock.type === 'Lecture' && candidateBlock.deliveryMode !== 'Asynchronous' && !asynchList.includes(candidateBlock.day)) {
      const existingLab = existingBlocks.find(b =>
        b.id !== candidateBlock.id &&
        b.sectionId === candidateBlock.sectionId &&
        b.subjectId === candidateBlock.subjectId &&
        b.type === 'Laboratory'
      );

      if (existingLab) {
        const labDayIdx = DAYS_ORDER.indexOf(existingLab.day);
        const labStartM = timeToMinutes(existingLab.startTime);

        // Same day violation: Lecture ends after Lab starts on the same day -> STRICT ERROR
        if (candDayIdx === labDayIdx && candEndM > labStartM) {
          conflicts.push({
            type: 'error',
            category: 'pedagogical_order',
            conflictingBlockId: existingLab.id,
            shortMessage: 'F2F Lecture must precede Lab on the same day',
            message: `PEDAGOGICAL ORDER CONFLICT: On the same day (${candidateBlock.day}), the Face-to-Face Lecture must conclude before the Laboratory session (${formatTime12(existingLab.startTime)} - ${formatTime12(existingLab.endTime)}) for ${subject.code}.`
          });
        } else if (candDayIdx > labDayIdx) {
          // Different day: Day of Lecture is later in the week than Lab -> WARNING
          conflicts.push({
            type: 'warning',
            category: 'pedagogical_order',
            conflictingBlockId: existingLab.id,
            shortMessage: 'F2F Lecture should precede Lab earlier in the week',
            message: `PEDAGOGICAL ORDER NOTICE: Face-to-Face Lecture for ${subject.code} is scheduled on ${candidateBlock.day}, while Laboratory is on an earlier day (${existingLab.day}). Lecture should precede Laboratory for this subject.`
          });
        }
      }
    }
  }

  // 0.5 Late Schedule Priority: Prioritize not exceeding 5:00 PM (17:00 / 1020 mins) unless strictly needed
  if (candidateBlock.endTime) {
    const eMin = timeToMinutes(candidateBlock.endTime);
    if (eMin > 1020) {
      conflicts.push({
        type: 'warning',
        category: 'late_after_5pm',
        shortMessage: `Past 5:00 PM (${formatTime12(candidateBlock.endTime)})`,
        message: `LATE SCHEDULE WARNING: Class concludes at ${formatTime12(candidateBlock.endTime)} (past 5:00 PM). Schedules should remain within 7:30 AM - 5:00 PM unless strictly necessary.`
      });
    }
  }

  // 0.6 Saturday Instructor Preference: Scheduling on Saturday prohibited unless explicitly 'preferred' by instructor
  if (candidateBlock.day === 'Saturday' && teacher) {
    const satAvail = teacher.availability?.Saturday;
    let isSatSlotPreferred = false;

    if (satAvail && typeof satAvail === 'object') {
      COLLEGE_TIME_SLOTS.forEach(slot => {
        if (slot.isLunch) return;
        if (doTimesOverlap(candidateBlock.startTime, candidateBlock.endTime, slot.start, slot.end)) {
          if (satAvail[slot.id] === 'preferred') {
            isSatSlotPreferred = true;
          }
        }
      });
    }

    if (!isSatSlotPreferred) {
      conflicts.push({
        type: 'error',
        category: 'saturday_preference',
        shortMessage: 'Saturday Not Allowed (Not Instructor Preferred)',
        message: `SATURDAY PREFERENCE RESTRICTION: ${teacher.name} has not set Saturday as Preferred. Scheduling on Saturday is strictly prohibited unless explicitly marked as Preferred by the instructor.`
      });
    }
  }

  // 1. Asynchronous Room Policy Check
  if (candidateBlock.deliveryMode === 'Asynchronous' && candidateBlock.roomId) {
    conflicts.push({
      type: 'warning',
      category: 'asynch_room',
      shortMessage: 'Asynchronous session must not have a room',
      message: 'ASYNCHRONOUS POLICY: Asynchronous sessions are online/self-paced and must not be assigned a physical room.'
    });
  }

  // Room Type Designation & Fit Room Checks (Physical F2F rooms only)
  if (candidateBlock.deliveryMode !== 'Asynchronous' && candidateBlock.roomId) {
    if (candidateBlock.type === 'Laboratory' && room && room.type && room.type !== 'Laboratory' && room.type !== 'Lecture & Laboratory' && room.type !== 'Both') {
      conflicts.push({
        type: 'error',
        category: 'room_type',
        shortMessage: `Invalid Room Type (${room.name})`,
        message: `ROOM DESIGNATION CONFLICT: Laboratory sessions cannot be held in ${room.name} (${room.type}). Must be assigned to a Laboratory or Lecture & Laboratory room.`
      });
    } else if (candidateBlock.type === 'Lecture' && room && room.type === 'Laboratory') {
      conflicts.push({
        type: 'error',
        category: 'room_type',
        shortMessage: `Invalid Room Type (${room.name})`,
        message: `ROOM DESIGNATION CONFLICT: Lecture sessions cannot be held in ${room.name} (Laboratory). Must be assigned to Lecture, AVR, or Lecture & Laboratory room.`
      });
    }

    // Subject Fit Room Warning Check
    const allowedFitRooms = candidateBlock.type === 'Laboratory' ? subject?.allowedLabRoomIds : subject?.allowedLecRoomIds;
    if (allowedFitRooms && allowedFitRooms.length > 0 && !allowedFitRooms.includes(candidateBlock.roomId)) {
      conflicts.push({
        type: 'warning',
        category: 'room_fit',
        shortMessage: `Not a Designated Fit Room (${room?.name || 'Room'})`,
        message: `ROOM FIT WARNING: ${room?.name || 'Selected room'} is not in the designated fit rooms list for ${subject?.code || 'this subject'}.`
      });
    }
  }

  // 2. Teacher Availability Check
  if (teacher && teacher.availability && candidateBlock.day) {
    const dayAvail = teacher.availability[candidateBlock.day];
    if (dayAvail) {
      let unavailableFound = false;
      COLLEGE_TIME_SLOTS.forEach(slot => {
        if (slot.isLunch) return;
        if (doTimesOverlap(candidateBlock.startTime, candidateBlock.endTime, slot.start, slot.end)) {
          if (dayAvail[slot.id] === 'unavailable') {
            unavailableFound = true;
          }
        }
      });

      if (unavailableFound) {
        conflicts.push({
          type: 'warning',
          category: 'availability',
          shortMessage: `Instructor Unavailable (${teacher.name})`,
          message: `INSTRUCTOR AVAILABILITY: ${teacher.name} is marked as UNAVAILABLE on ${candidateBlock.day} (${formatTime12(candidateBlock.startTime)} - ${formatTime12(candidateBlock.endTime)}).`
        });
      }
    }
  }

  // 3. Overlap Checks with existing schedule blocks
  existingBlocks.forEach(existing => {
    if (existing.id === candidateBlock.id) return; // ignore self
    if (existing.day !== candidateBlock.day) return; // different day

    if (doTimesOverlap(candidateBlock.startTime, candidateBlock.endTime, existing.startTime, existing.endTime)) {
      const otherSec = sections.find(s => s.id === existing.sectionId);
      const otherSub = subjects.find(s => s.id === existing.subjectId);
      const otherTeacher = teachers.find(t => t.id === existing.teacherId);
      const otherRoom = rooms.find(r => r.id === existing.roomId);
      const timeSpan = `${formatTime12(existing.startTime)} - ${formatTime12(existing.endTime)}`;

      // Room Double Booking (Only checked when both sessions are Face-to-Face and have a physical roomId)
      const isCandidateAsynch = candidateBlock.deliveryMode === 'Asynchronous' || !candidateBlock.roomId;
      const isExistingAsynch = existing.deliveryMode === 'Asynchronous' || !existing.roomId;

      if (!isCandidateAsynch && !isExistingAsynch && candidateBlock.roomId && existing.roomId === candidateBlock.roomId) {
        conflicts.push({
          type: 'error',
          category: 'room',
          conflictingBlockId: existing.id,
          shortMessage: `Room occupied by ${otherSec?.code || 'another section'} (${timeSpan})`,
          message: `ROOM CONFLICT: Room ${room?.name || 'Room'} is already occupied by ${otherSec?.code || 'Other Section'} (${otherSub?.code || 'Subject'}) under ${otherTeacher?.name || 'Instructor'} from ${timeSpan}.`
        });
      }

      // Teacher Double Booking
      if (candidateBlock.teacherId && existing.teacherId === candidateBlock.teacherId) {
        conflicts.push({
          type: 'error',
          category: 'teacher',
          conflictingBlockId: existing.id,
          shortMessage: `Instructor teaching ${otherSec?.code || 'another section'} (${timeSpan})`,
          message: `INSTRUCTOR CONFLICT: ${teacher?.name || 'Instructor'} is already teaching ${otherSec?.code || 'Other Section'} (${otherSub?.code || 'Subject'}) in ${otherRoom?.name || 'Room'} from ${timeSpan}.`
        });
      }

      // Section Double Booking
      if (candidateBlock.sectionId && existing.sectionId === candidateBlock.sectionId) {
        conflicts.push({
          type: 'error',
          category: 'section',
          conflictingBlockId: existing.id,
          shortMessage: `Section has class in ${otherSub?.code || 'another subject'} (${timeSpan})`,
          message: `SECTION CONFLICT: Section ${section?.code || 'Section'} already has a scheduled class for ${otherSub?.code || 'Subject'} (${existing.type || 'Lecture'}) in ${otherRoom?.name || 'Room'} from ${timeSpan}.`
        });
      }
    }
  });

  return conflicts;
};

export const getALLConflicts = (
  blocks,
  rooms,
  teachers,
  subjects,
  sections,
  asynchronousDays = ['Wednesday']
) => {
  const map = {};
  blocks.forEach(block => {
    const blockConflicts = validateBlock(block, blocks, rooms, teachers, subjects, sections, asynchronousDays);
    if (blockConflicts.length > 0) {
      map[block.id] = blockConflicts;
    }
  });
  return map;
};

/**
 * Finds completely vacant/unoccupied rooms matching session type for a given day & time range.
 * DOES NOT modify any schedule; strictly returns recommendation options for the Dean Workstation.
 */
export const getVacantRoomRecommendations = (candidateBlock, existingBlocks, rooms, subjects = []) => {
  if (!candidateBlock || !candidateBlock.day || !candidateBlock.startTime || !candidateBlock.endTime) return [];

  const subject = subjects.find(s => s.id === candidateBlock.subjectId);
  const sessionType = candidateBlock.type || 'Lecture';

  // 1. Filter rooms by designation suitability
  const suitableRooms = rooms.filter(r => {
    if (sessionType === 'Laboratory') {
      return !r.type || r.type === 'Laboratory' || r.type === 'Lecture & Laboratory' || r.type === 'Both';
    } else {
      return !r.type || r.type === 'Lecture' || r.type === 'AVR' || r.type === 'Lecture & Laboratory' || r.type === 'Both';
    }
  });

  // 2. Filter out rooms occupied during candidateBlock.day and candidateBlock.startTime to candidateBlock.endTime
  const vacantRooms = suitableRooms.filter(r => {
    const isOccupied = existingBlocks.some(b => {
      if (b.id === candidateBlock.id) return false; // ignore self
      if (b.day !== candidateBlock.day) return false;
      if (b.roomId !== r.id) return false;
      return doTimesOverlap(candidateBlock.startTime, candidateBlock.endTime, b.startTime, b.endTime);
    });
    return !isOccupied;
  });

  // 3. Mark approved fit rooms first
  const allowedFitIds = sessionType === 'Laboratory' ? subject?.allowedLabRoomIds : subject?.allowedLecRoomIds;
  const sortedVacant = [...vacantRooms].sort((a, b) => {
    const isFitA = allowedFitIds && allowedFitIds.includes(a.id) ? 1 : 0;
    const isFitB = allowedFitIds && allowedFitIds.includes(b.id) ? 1 : 0;
    return isFitB - isFitA;
  });

  return sortedVacant;
};
