/**
 * ============================================================================
 * CBSUA College Automated Scheduling Engine (autoScheduler.js)
 * ============================================================================
 * 
 * CORE SCHEDULING RULES & POLICIES IMPLEMENTED:
 * 1. Midday / Lunch Buffer (11:30 AM - 12:30 PM):
 *    - Highest priority is to leave this vacant (Tier 1 standard hours).
 *    - Used only as a fallback (Tier 2) when no other slots are available.
 * 
 * 2. 5:00 PM Cutoff Priority:
 *    - Highest priority to avoid scheduling past 5:00 PM (17:00).
 *    - Used only as a last resort (Tier 3 fallback) when necessary.
 * 
 * 3. Saturday Instructor Preference Rule:
 *    - Scheduling on Saturdays is strictly prohibited unless explicitly
 *      marked as 'preferred' by the instructor (even if available time exists).
 * 
 * 4. Pedagogical Sequencing (Lecture precedes Laboratory):
 *    - For subjects with both lecture and lab, Face-to-Face Lecture MUST precede
 *      the Laboratory session for that specific subject.
 *    - Lecture-only subjects are exempt from lab sequencing constraints.
 * 
 * 5. 2-Hour Lecture Policy (Split Lecture):
 *    - 2-hour lecture subjects are divided into 1h Face-to-Face (regular day)
 *      and 1h Asynchronous Online (on designated Asynch day, no room assigned).
 * 
 * 6. 3-Hour Laboratory Midday Split Slot (10:30-12:30 & 1:00-2:00):
 *    - 3-hour laboratories are permitted to be placed from 10:30 - 12:30 (2h)
 *      and 1:00 - 2:00 PM (1h) for a total of 3 hours, keeping the
 *      official 12:30 - 1:00 PM Lunch Break completely clear.
 * ============================================================================
 */

import { timeToMinutes, validateBlock, COLLEGE_TIME_SLOTS, doTimesOverlap } from './conflictChecker.js';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ============================================================================
// SECTION 1: TIME, DURATION & TIERED SLOT GENERATION
// ============================================================================

/**
 * Converts total minutes from midnight to 'HH:MM' 24-hour string format
 */
const minutesToTimeString = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Generates all possible start & end time slots matching a given session duration
 */
export const generateTimeSlotsForDuration = (durationHours) => {
  const slots = [];
  const durationMins = Math.round(durationHours * 60);

  // Morning standard slots: 7:30 AM to 12:30 PM (max 750 mins)
  const morningStarts = ['07:30', '08:30', '09:30', '10:30', '11:30'];
  morningStarts.forEach(start => {
    const endMinutes = timeToMinutes(start) + durationMins;
    if (endMinutes <= 750) {
      slots.push({
        start,
        end: minutesToTimeString(endMinutes),
        hours: durationHours,
        period: 'Morning'
      });
    }
  });

  // Afternoon & Evening slots: 1:00 PM to 7:00 PM (max 1140 mins)
  const afternoonStarts = ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  afternoonStarts.forEach(start => {
    const endMinutes = timeToMinutes(start) + durationMins;
    if (endMinutes <= 1140) {
      slots.push({
        start,
        end: minutesToTimeString(endMinutes),
        hours: durationHours,
        period: endMinutes > 1020 ? 'Evening' : 'Afternoon'
      });
    }
  });

  // SPECIAL FEATURE: 3-Hour Midday Split Slot (10:30-12:30 & 1:00-2:00)
  // For 3-hour sessions (e.g. Laboratory), allows bridging across the 12:30 - 1:00 PM Lunch Break:
  // Part 1: 10:30 AM - 12:30 PM (2 hours)
  // [12:30 PM - 1:00 PM Lunch Break]
  // Part 2: 1:00 PM - 2:00 PM (1 hour)
  // Total = 3 hours!
  if (durationHours === 3) {
    slots.push({
      start: '10:30',
      end: '14:00',
      hours: 3,
      period: 'Midday',
      isSplitMidday: true,
      parts: [
        { start: '10:30', end: '12:30', hours: 2 },
        { start: '13:00', end: '14:00', hours: 1 }
      ]
    });
  }

  return slots;
};

/**
 * Checks if a time slot overlaps the midday/lunch buffer (11:30 AM - 12:30 PM / 690 - 750 mins)
 */
export const isLunchBufferSlot = (startTime, endTime) => {
  return timeToMinutes(startTime) < 750 && timeToMinutes(endTime) > 690;
};

/**
 * Checks if a time slot extends past 5:00 PM (17:00 / 1020 mins)
 */
export const isPast5PMSlot = (startTime, endTime) => {
  return timeToMinutes(endTime) > 1020;
};

/**
 * Categorizes available time slots into 3 Priority Tiers:
 * - Tier 1 (preferred): Ends <= 5:00 PM AND outside 11:30-12:30 lunch buffer
 * - Tier 2 (fallbackLunch): Midday lunch buffer (11:30-12:30), ends <= 5:00 PM (Includes 10:30-12:30 & 1:00-2:00 split lab)
 * - Tier 3 (fallbackLate): Late evening hours (ends past 5:00 PM / 17:00+)
 */
export const getTieredTimeSlots = (durationHours) => {
  const allSlots = generateTimeSlotsForDuration(durationHours);
  const preferred = allSlots.filter(s => !isLunchBufferSlot(s.start, s.end) && !isPast5PMSlot(s.start, s.end));
  const fallbackLunch = allSlots.filter(s => isLunchBufferSlot(s.start, s.end) && !isPast5PMSlot(s.start, s.end));
  const fallbackLate = allSlots.filter(s => isPast5PMSlot(s.start, s.end));
  return { preferred, fallbackLunch, fallbackLate, all: allSlots };
};

// ============================================================================
// SECTION 2: INSTRUCTOR & ROOM MATCHING HELPERS
// ============================================================================

/**
 * Checks whether an instructor explicitly marked Saturday as 'preferred' (not merely available)
 */
export const isTeacherSaturdayPreferred = (teacher, slotStart = null, slotEnd = null) => {
  if (!teacher?.availability?.Saturday || typeof teacher.availability.Saturday !== 'object') return false;
  const satAvail = teacher.availability.Saturday;

  if (slotStart && slotEnd) {
    let isPref = false;
    COLLEGE_TIME_SLOTS.forEach(slot => {
      if (!slot.isLunch && doTimesOverlap(slotStart, slotEnd, slot.start, slot.end)) {
        if (satAvail[slot.id] === 'preferred') isPref = true;
      }
    });
    return isPref;
  }

  return Object.values(satAvail).some(status => status === 'preferred');
};

/**
 * Computes an instructor's currently scheduled hours in the draft schedule
 */
const getTeacherCurrentHours = (teacherId, draftBlocks, teacherAssignedSubjects = [], allSubjects = []) => {
  const tBlocks = draftBlocks.filter(b => b.teacherId === teacherId);
  const scheduledHours = tBlocks.reduce((sum, b) => sum + (timeToMinutes(b.endTime) - timeToMinutes(b.startTime)) / 60, 0);
  if (scheduledHours > 0) return scheduledHours;

  const tSubIds = Array.from(new Set(tBlocks.map(b => b.subjectId)));
  const assigned = allSubjects.filter(s => (teacherAssignedSubjects || []).includes(s.id) || tSubIds.includes(s.id));
  return assigned.reduce((sum, s) => sum + (s.totalHours || ((s.lecHours || 0) + (s.labHours || 0)) || 0), 0);
};

/**
 * Selects the optimal instructor for a subject:
 * 1. Prioritizes explicit Section + Subject assignments.
 * 2. Next, checks instructors assigned to this subject.
 * 3. Balances teaching workload by picking the instructor with the fewest hours.
 */
const findBestInstructorForSubject = (subject, section, teachers, draftBlocks, allSubjects) => {
  if (!teachers || teachers.length === 0) return null;

  // 1. Explicit Section + Subject pair assignment
  const paired = teachers.filter(t => (t.assignedSectionSubjectPairs || []).some(p => p.subjectId === subject.id && p.sectionId === section?.id));
  if (paired.length > 0) {
    return [...paired].sort((a, b) => getTeacherCurrentHours(a.id, draftBlocks, a.assignedSubjectIds, allSubjects) - getTeacherCurrentHours(b.id, draftBlocks, b.assignedSubjectIds, allSubjects))[0];
  }

  // 2. Explicitly assigned instructors for this subject
  const explicit = teachers.filter(t => (t.assignedSubjectIds || []).includes(subject.id));
  const pool = explicit.length > 0 ? explicit : teachers;

  return [...pool].sort((a, b) => getTeacherCurrentHours(a.id, draftBlocks, a.assignedSubjectIds, allSubjects) - getTeacherCurrentHours(b.id, draftBlocks, b.assignedSubjectIds, allSubjects))[0] || teachers[0];
};

/**
 * Returns candidate rooms suited for a session type (Lecture vs Lab)
 * Prioritizes designated 'fit rooms' (allowedLabRoomIds / allowedLecRoomIds)
 */
const getCandidateRoomsForSession = (sessionType, subject, allRooms) => {
  const isLab = sessionType === 'Laboratory';
  const allowedIds = isLab
    ? (subject.allowedLabRoomIds || (subject.defaultLabRoomId ? [subject.defaultLabRoomId] : []))
    : (subject.allowedLecRoomIds || (subject.defaultLecRoomId ? [subject.defaultLecRoomId] : []));

  const suitableRooms = allRooms.filter(r => {
    if (!r.type || r.type === 'Both' || r.type === 'Lecture & Laboratory') return true;
    return isLab ? r.type === 'Laboratory' : (r.type === 'Lecture' || r.type === 'AVR');
  });

  const fitRooms = allowedIds.length > 0 ? suitableRooms.filter(r => allowedIds.includes(r.id)) : suitableRooms;
  return fitRooms.length > 0 ? [...fitRooms, ...suitableRooms.filter(r => !fitRooms.some(fr => fr.id === r.id))] : allRooms;
};

/**
 * Probes remaining conflict-free open slots across candidate rooms for diagnostic reporting
 */
const findRemainingAvailableSlots = (durationHours, teacher, subject, candidateRooms, existingBlocks, asynchList) => {
  const openSlots = [];
  const allSlots = generateTimeSlotsForDuration(durationHours);
  const regularDays = DAYS.filter(d => !asynchList.includes(d));

  for (const day of regularDays) {
    if (day === 'Saturday' && !isTeacherSaturdayPreferred(teacher)) continue;

    for (const room of candidateRooms) {
      for (const slot of allSlots) {
        if (day === 'Saturday' && !isTeacherSaturdayPreferred(teacher, slot.start, slot.end)) continue;

        if (slot.isSplitMidday) {
          // Probe Part 1 (10:30-12:30)
          const p1Block = {
            id: 'probe-p1', sectionId: 'probe-sec', subjectId: subject.id, teacherId: teacher?.id, roomId: room.id,
            day, startTime: '10:30', endTime: '12:30', type: 'Laboratory', deliveryMode: 'Face-to-Face'
          };
          const conf1 = validateBlock(p1Block, existingBlocks, [room], [teacher], [subject], [], asynchList);
          if (conf1.some(c => c.type === 'error' || c.category === 'availability' || c.category === 'saturday_preference')) continue;

          // Probe Part 2 (13:00-14:00)
          const p2Block = {
            id: 'probe-p2', sectionId: 'probe-sec', subjectId: subject.id, teacherId: teacher?.id, roomId: room.id,
            day, startTime: '13:00', endTime: '14:00', type: 'Laboratory', deliveryMode: 'Face-to-Face'
          };
          const conf2 = validateBlock(p2Block, [...existingBlocks, p1Block], [room], [teacher], [subject], [], asynchList);
          if (conf2.some(c => c.type === 'error' || c.category === 'availability' || c.category === 'saturday_preference')) continue;

          openSlots.push({
            day,
            startTime: '10:30',
            endTime: '14:00',
            displayTime: '10:30-12:30 & 1:00-2:00 (Split)',
            roomName: room.name,
            isLunch: true,
            isPast5PM: false
          });
          if (openSlots.length >= 3) return openSlots;
        } else {
          const candidateBlock = {
            id: 'probe',
            sectionId: 'probe-sec',
            subjectId: subject.id,
            teacherId: teacher?.id,
            roomId: room.id,
            day,
            startTime: slot.start,
            endTime: slot.end,
            type: (subject.labHours || 0) > 0 ? 'Laboratory' : 'Lecture',
            deliveryMode: 'Face-to-Face'
          };

          const conflicts = validateBlock(candidateBlock, existingBlocks, [room], [teacher], [subject], [], asynchList);
          const hasError = conflicts.some(c => c.type === 'error' || c.category === 'availability' || c.category === 'saturday_preference');

          if (!hasError) {
            openSlots.push({
              day,
              startTime: slot.start,
              endTime: slot.end,
              roomName: room.name,
              isLunch: isLunchBufferSlot(slot.start, slot.end),
              isPast5PM: isPast5PMSlot(slot.start, slot.end)
            });
            if (openSlots.length >= 3) return openSlots;
          }
        }
      }
    }
  }

  return openSlots;
};

// ============================================================================
// SECTION 3: BLOCK BUILDER & VALIDATOR HELPERS
// ============================================================================

/**
 * Creates a schedule block object with standard defaults
 */
const makeBlock = ({ idPrefix = 'auto', section, subject, teacher, room, day, slot, type, deliveryMode, semester, notes }) => ({
  id: `${idPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
  sectionId: section.id,
  subjectId: subject.id,
  teacherId: teacher?.id,
  roomId: room?.id || null,
  day,
  startTime: slot.start,
  endTime: slot.end,
  type,
  deliveryMode,
  semester: semester || '1st Semester',
  notes: notes || `Auto-scheduled ${type} (${slot.hours}h)`
});

/**
 * Validates a candidate block against all institutional constraints
 */
const isBlockValid = (block, existingBlocks, rooms, teachers, subjects, sections, asynchList) => {
  const conflicts = validateBlock(block, existingBlocks, rooms, teachers, subjects, sections, asynchList);
  return !conflicts.some(c => c.type === 'error' || c.category === 'availability' || c.category === 'saturday_preference');
};

// ============================================================================
// SECTION 4: SINGLE SESSION PLACEMENT ENGINE
// ============================================================================

/**
 * Attempts to place a single session using the 3-Tier priority strategy:
 * Tier 1: Preferred standard hours (7:30 AM - 5:00 PM, avoiding 11:30-12:30 lunch)
 * Tier 2: Midday lunch buffer fallback (11:30 AM - 12:30 PM & 10:30-12:30 / 1:00-2:00 split lab)
 * Tier 3: Late evening fallback (past 5:00 PM / 17:00+)
 */
const tryPlaceSingleSession = ({
  durationHours,
  candidateDays,
  candidateRooms,
  teacher,
  section,
  subject,
  sessionType,
  deliveryMode,
  semester,
  existingBlocks,
  rooms,
  teachers,
  subjects,
  sections,
  asynchList,
  isSlotValid = () => true
}) => {
  const { preferred, fallbackLunch, fallbackLate } = getTieredTimeSlots(durationHours);
  const tiers = [
    { name: 'preferred', slots: preferred },
    { name: 'fallback_lunch', slots: fallbackLunch },
    { name: 'fallback_late', slots: fallbackLate }
  ];

  for (const tier of tiers) {
    if (!tier.slots.length) continue;

    for (const day of candidateDays) {
      if (day === 'Saturday' && teacher && !isTeacherSaturdayPreferred(teacher)) continue;

      for (const room of candidateRooms) {
        for (const slot of tier.slots) {
          if (day === 'Saturday' && teacher && !isTeacherSaturdayPreferred(teacher, slot.start, slot.end)) continue;
          if (!isSlotValid(day, room, slot)) continue;

          if (slot.isSplitMidday) {
            // Handle 3-Hour Split Midday Laboratory (10:30-12:30 & 1:00-2:00)
            const blockPart1 = makeBlock({
              idPrefix: 'auto-lab-p1', section, subject, teacher, room, day,
              slot: slot.parts[0], type: sessionType, deliveryMode, semester,
              notes: `Auto-scheduled ${sessionType} (Part 1/2: 10:30-12:30, 2h)`
            });
            if (!isBlockValid(blockPart1, existingBlocks, rooms, teachers, subjects, sections, asynchList)) continue;

            const blockPart2 = makeBlock({
              idPrefix: 'auto-lab-p2', section, subject, teacher, room, day,
              slot: slot.parts[1], type: sessionType, deliveryMode, semester,
              notes: `Auto-scheduled ${sessionType} (Part 2/2: 1:00-2:00, 1h)`
            });
            if (!isBlockValid(blockPart2, [...existingBlocks, blockPart1], rooms, teachers, subjects, sections, asynchList)) continue;

            return {
              placed: true,
              blocks: [blockPart1, blockPart2],
              block: blockPart1,
              room,
              day,
              slot,
              usedFallback: true,
              fallbackReason: '10:30-12:30 & 1:00-2:00 Split across Lunch (Lunch Buffer)',
              tier: tier.name
            };
          } else {
            const block = makeBlock({
              section, subject, teacher, room, day, slot,
              type: sessionType, deliveryMode, semester
            });

            if (isBlockValid(block, existingBlocks, rooms, teachers, subjects, sections, asynchList)) {
              return {
                placed: true,
                blocks: [block],
                block,
                room,
                day,
                slot,
                usedFallback: tier.name !== 'preferred',
                fallbackReason: tier.name === 'fallback_lunch'
                  ? '11:30 - 12:30 Lunch Buffer'
                  : tier.name === 'fallback_late' ? 'Past 5:00 PM (17:00+)' : null,
                tier: tier.name
              };
            }
          }
        }
      }
    }
  }

  return { placed: false };
};

// ============================================================================
// SECTION 5: COORDINATED PLACEMENT ENGINE (Lecture before Laboratory)
// ============================================================================

/**
 * Coordinated scheduler for subjects with BOTH Face-to-Face Lecture and Laboratory:
 * Ensures for this specific subject, Face-to-Face Lecture is placed BEFORE its Laboratory session.
 * 
 * Strategy:
 * - Pass 1 (Strict Sequence): Lecture on earlier day, Lab on subsequent day (or same day afternoon).
 * - Pass 2 (Graceful Day Fallback): Places Lab on any conflict-free regular day if subsequent days are 100% full.
 */
const tryPlaceCoordinatedSubject = ({
  lecF2FHours,
  labHours,
  regularDays,
  teacher,
  subject,
  section,
  semester,
  candidateLecRooms,
  candidateLabRooms,
  existingBlocks,
  rooms,
  teachers,
  subjects,
  sections,
  asynchList
}) => {
  const { preferred: lecPref, fallbackLunch: lecLunch, fallbackLate: lecLate } = getTieredTimeSlots(lecF2FHours);
  const { preferred: labPref, fallbackLunch: labLunch, fallbackLate: labLate } = getTieredTimeSlots(labHours);

  const tiers = [
    { name: 'preferred', lecSlots: lecPref, labSlots: labPref },
    { name: 'fallback_lunch', lecSlots: [...lecPref, ...lecLunch], labSlots: [...labPref, ...labLunch] },
    { name: 'fallback_late', lecSlots: [...lecPref, ...lecLunch, ...lecLate], labSlots: [...labPref, ...labLunch, ...labLate] }
  ];

  const passes = [
    { name: 'strict', allowAnyDayForLab: false },
    { name: 'day_fallback', allowAnyDayForLab: true }
  ];

  const sortedLecDays = [...regularDays].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));

  for (const pass of passes) {
    for (const tier of tiers) {
      if (!tier.lecSlots.length || !tier.labSlots.length) continue;

      for (const lecDay of sortedLecDays) {
        if (lecDay === 'Saturday' && !isTeacherSaturdayPreferred(teacher)) continue;

        for (const lecRoom of candidateLecRooms) {
          for (const lecSlot of tier.lecSlots) {
            if (lecDay === 'Saturday' && !isTeacherSaturdayPreferred(teacher, lecSlot.start, lecSlot.end)) continue;

            const lecBlock = makeBlock({
              idPrefix: 'auto-lec', section, subject, teacher, room: lecRoom, day: lecDay, slot: lecSlot,
              type: 'Lecture', deliveryMode: 'Face-to-Face', semester
            });

            if (!isBlockValid(lecBlock, existingBlocks, rooms, teachers, subjects, sections, asynchList)) continue;

            // Candidate lab days based on pedagogical sequence
            let candidateLabDays;
            if (pass.allowAnyDayForLab) {
              candidateLabDays = regularDays;
            } else {
              const subsequentDays = regularDays.filter(d => DAYS.indexOf(d) > DAYS.indexOf(lecDay));
              const sameDay = [lecDay];
              candidateLabDays = [...subsequentDays, ...sameDay];
            }

            for (const labDay of candidateLabDays) {
              if (labDay === 'Saturday' && !isTeacherSaturdayPreferred(teacher)) continue;

              for (const labRoom of candidateLabRooms) {
                for (const labSlot of tier.labSlots) {
                  if (labDay === 'Saturday' && !isTeacherSaturdayPreferred(teacher, labSlot.start, labSlot.end)) continue;

                  if (labSlot.isSplitMidday) {
                    // Same day constraint: Lecture must finish at or before 10:30 AM
                    if (labDay === lecDay && timeToMinutes('10:30') < timeToMinutes(lecSlot.end)) continue;

                    const labBlockPart1 = makeBlock({
                      idPrefix: 'auto-lab-p1', section, subject, teacher, room: labRoom, day: labDay,
                      slot: labSlot.parts[0], type: 'Laboratory', deliveryMode: 'Face-to-Face', semester,
                      notes: 'Auto-scheduled Laboratory (Part 1/2: 10:30-12:30, 2h)'
                    });
                    if (!isBlockValid(labBlockPart1, [...existingBlocks, lecBlock], rooms, teachers, subjects, sections, asynchList)) continue;

                    const labBlockPart2 = makeBlock({
                      idPrefix: 'auto-lab-p2', section, subject, teacher, room: labRoom, day: labDay,
                      slot: labSlot.parts[1], type: 'Laboratory', deliveryMode: 'Face-to-Face', semester,
                      notes: 'Auto-scheduled Laboratory (Part 2/2: 1:00-2:00, 1h)'
                    });
                    if (!isBlockValid(labBlockPart2, [...existingBlocks, lecBlock, labBlockPart1], rooms, teachers, subjects, sections, asynchList)) continue;

                    const usedFallback = true;
                    const fallbackReason = pass.allowAnyDayForLab
                      ? 'Day Sequence Fallback (Subsequent days full)'
                      : '10:30-12:30 & 1:00-2:00 Split across Lunch (Lunch Buffer)';

                    return {
                      placed: true,
                      lecBlock,
                      labBlocks: [labBlockPart1, labBlockPart2],
                      labBlock: labBlockPart1,
                      lecRoom,
                      labRoom,
                      lecDay,
                      labDay,
                      lecSlot,
                      labSlot,
                      usedFallback,
                      fallbackReason,
                      tier: tier.name
                    };
                  } else {
                    // Standard contiguous lab slot
                    if (labDay === lecDay && timeToMinutes(labSlot.start) < timeToMinutes(lecSlot.end)) continue;

                    const labBlock = makeBlock({
                      idPrefix: 'auto-lab', section, subject, teacher, room: labRoom, day: labDay, slot: labSlot,
                      type: 'Laboratory', deliveryMode: 'Face-to-Face', semester
                    });

                    if (isBlockValid(labBlock, [...existingBlocks, lecBlock], rooms, teachers, subjects, sections, asynchList)) {
                      const usedFallback = tier.name !== 'preferred' || pass.allowAnyDayForLab;
                      const fallbackReason = pass.allowAnyDayForLab
                        ? 'Day Sequence Fallback (Subsequent days full)'
                        : isPast5PMSlot(lecSlot.start, lecSlot.end) || isPast5PMSlot(labSlot.start, labSlot.end)
                          ? 'Past 5:00 PM (17:00+)'
                          : isLunchBufferSlot(lecSlot.start, lecSlot.end) || isLunchBufferSlot(labSlot.start, labSlot.end)
                            ? '11:30 - 12:30 Lunch Buffer'
                            : null;

                      return {
                        placed: true,
                        lecBlock,
                        labBlocks: [labBlock],
                        labBlock,
                        lecRoom,
                        labRoom,
                        lecDay,
                        labDay,
                        lecSlot,
                        labSlot,
                        usedFallback,
                        fallbackReason,
                        tier: tier.name
                      };
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return { placed: false };
};

// ============================================================================
// SECTION 6: SUBJECT REQUIREMENTS CALCULATION HELPER
// ============================================================================

/**
 * Computes exact remaining lecture (F2F & Asynch) and lab hours needed for a subject.
 * Automatically enforces the 1h Asynch + 1h F2F split for 2-hour lecture subjects.
 */
const getSubjectSessionRequirements = (subject, existingBlocksForSub, asynchList = []) => {
  const is2HrLec = subject.lecHours === 2;
  const hasAsynchDays = asynchList.length > 0;

  // 1. Asynchronous Lecture (Online, 1 hour on designated asynch day)
  const hasAsynch = existingBlocksForSub.some(
    b => b.type === 'Lecture' && (b.deliveryMode === 'Asynchronous' || asynchList.includes(b.day))
  );
  const needsAsynch = is2HrLec && hasAsynchDays && !hasAsynch;

  // 2. Face-to-Face Lecture
  let neededF2FLec = 0;
  if (is2HrLec && hasAsynchDays) {
    const hasF2F = existingBlocksForSub.some(
      b => b.type === 'Lecture' && b.deliveryMode !== 'Asynchronous' && !asynchList.includes(b.day)
    );
    neededF2FLec = hasF2F ? 0 : 1;
  } else {
    const scheduledLecHours = existingBlocksForSub
      .filter(b => b.type === 'Lecture')
      .reduce((sum, b) => sum + (timeToMinutes(b.endTime) - timeToMinutes(b.startTime)) / 60, 0);
    neededF2FLec = Math.max(0, (subject.lecHours || 0) - scheduledLecHours);
  }

  // 3. Laboratory
  const scheduledLabHours = existingBlocksForSub
    .filter(b => b.type === 'Laboratory')
    .reduce((sum, b) => sum + (timeToMinutes(b.endTime) - timeToMinutes(b.startTime)) / 60, 0);
  const neededLab = Math.max(0, (subject.labHours || 0) - scheduledLabHours);

  return { needsAsynch, neededF2FLec, neededLab };
};

// ============================================================================
// SECTION 7: MAIN SCHEDULER ENTRY POINT
// ============================================================================

/**
 * Main Auto-Generate Schedule Algorithm
 */
export const autoGenerateSchedule = (
  sections = [],
  subjects = [],
  teachers = [],
  rooms = [],
  currentBlocks = [],
  mode = 'rebuild',
  selectedSemester = '1st Semester',
  selectedYearLevel = 'ALL',
  asynchronousDays = ['Wednesday']
) => {
  const asynchList = Array.isArray(asynchronousDays)
    ? asynchronousDays
    : (asynchronousDays?.asynchronousDays || ['Wednesday']);

  const newBlocks = mode === 'append' ? [...currentBlocks] : [];
  const logs = [];
  const blockedConflictReports = [];
  const sectionSummaries = [];
  const fallbackSessions = [];
  const unplacedSessions = [];
  let addedCount = 0;

  // Filter sections by selected Year Level if active
  const targetSections = sections.filter(sec => {
    if (selectedYearLevel !== 'ALL' && String(sec.yearLevel) !== String(selectedYearLevel)) return false;
    return true;
  });

  targetSections.forEach(section => {
    let sectionAddedCount = 0;

    // Filter subjects by matching Semester and Year Level
    const targetSubjects = subjects.filter(sub => {
      if (selectedSemester !== 'ALL') {
        const subSem = sub.semester || '1st Semester';
        if (subSem !== selectedSemester && subSem !== 'Both' && subSem !== 'All') return false;
      }
      if (selectedYearLevel !== 'ALL') {
        if (sub.yearLevel && String(sub.yearLevel) !== String(selectedYearLevel) && String(sub.yearLevel) !== String(section.yearLevel)) return false;
      } else {
        if (sub.yearLevel && section.yearLevel && String(sub.yearLevel) !== String(section.yearLevel)) return false;
      }
      return true;
    });

    targetSubjects.forEach(subject => {
      const existingForSub = newBlocks.filter(b => b.sectionId === section.id && b.subjectId === subject.id);
      const { needsAsynch, neededF2FLec, neededLab } = getSubjectSessionRequirements(subject, existingForSub, asynchList);

      // Skip if all session requirements for this subject are already scheduled
      if (!needsAsynch && neededF2FLec === 0 && neededLab === 0) return;

      const chosenTeacher = findBestInstructorForSubject(subject, section, teachers, newBlocks, subjects);
      if (!chosenTeacher) {
        const msg = `🚫 COULD NOT SCHEDULE ${section.code} - ${subject.code}: No designated instructor available.`;
        blockedConflictReports.push(msg);
        unplacedSessions.push({
          section,
          subject,
          teacher: null,
          sessionType: (subject.lecHours || 0) > 0 ? 'Lecture' : 'Laboratory',
          hours: neededF2FLec || neededLab || 1,
          reason: 'No instructor assigned to this subject.',
          remainingSlots: []
        });
        return;
      }

      // Filter regular days: exclude Asynch days and non-preferred Saturday
      const regularDays = DAYS.filter(d => !asynchList.includes(d) && (d !== 'Saturday' || isTeacherSaturdayPreferred(chosenTeacher)));
      const candidateLecRooms = getCandidateRoomsForSession('Lecture', subject, rooms);
      const candidateLabRooms = getCandidateRoomsForSession('Laboratory', subject, rooms);

      // Record helper for successfully placed sessions
      const recordPlacedSession = ({ blocks, block, room, day, slot, sessionType, usedFallback, fallbackReason, tier }) => {
        const blocksToPush = blocks && blocks.length > 0 ? blocks : (block ? [block] : []);
        blocksToPush.forEach(b => newBlocks.push(b));
        addedCount++;
        sectionAddedCount++;

        if (usedFallback) {
          fallbackSessions.push({
            block: blocksToPush[0],
            blocks: blocksToPush,
            section,
            subject,
            teacher: chosenTeacher,
            room,
            day,
            slot,
            fallbackReason,
            tier
          });
        }

        const fallbackTag = usedFallback ? ` [${fallbackReason}]` : '';
        const roomName = room ? `@ ${room.name}` : '[Online / No Room]';
        const icon = blocksToPush[0]?.deliveryMode === 'Asynchronous' ? '⚡' : sessionType === 'Laboratory' ? '🔬' : '🏛️';
        const timeSpan = slot?.isSplitMidday
          ? `${day} 10:30-12:30 & 1:00-2:00`
          : `${day} ${slot?.start}-${slot?.end}`;

        logs.push(`${icon} Scheduled ${blocksToPush[0]?.deliveryMode === 'Asynchronous' ? 'Asynch ' : ''}${sessionType} (${slot?.hours || 1}h)${fallbackTag}: ${section.code} - ${subject.code} (${timeSpan}) ${roomName} w/ ${chosenTeacher.name}`);
      };

      // Record helper for sessions that could not be scheduled automatically
      const recordUnplacedSession = ({ sessionType, hours, reason, roomsPool }) => {
        blockedConflictReports.push(reason);
        const remainingSlots = findRemainingAvailableSlots(hours, chosenTeacher, subject, roomsPool, newBlocks, asynchList);
        unplacedSessions.push({ section, subject, teacher: chosenTeacher, sessionType, hours, reason, remainingSlots });
      };

      // ----------------------------------------------------------------------
      // STEP 1: Asynchronous Lecture (Online / No Room on Asynch Day)
      // ----------------------------------------------------------------------
      if (needsAsynch) {
        const asynchRes = tryPlaceSingleSession({
          durationHours: 1,
          candidateDays: asynchList,
          candidateRooms: [null],
          teacher: chosenTeacher,
          section,
          subject,
          sessionType: 'Lecture',
          deliveryMode: 'Asynchronous',
          semester: selectedSemester,
          existingBlocks: newBlocks,
          rooms,
          teachers,
          subjects,
          sections,
          asynchList
        });

        if (asynchRes.placed) {
          recordPlacedSession({ ...asynchRes, sessionType: 'Lecture' });
        } else {
          recordUnplacedSession({
            sessionType: 'Lecture',
            hours: 1,
            roomsPool: candidateLecRooms,
            reason: `⚠️ Could not place Asynch Lecture (1h) for ${section.code} - ${subject.code} on Asynch Day (${asynchList.join(', ')}): Section or instructor time overlap.`
          });
        }
      }

      // ----------------------------------------------------------------------
      // STEP 2: Face-to-Face Sessions Placement
      // ----------------------------------------------------------------------
      if (neededF2FLec > 0 && neededLab > 0) {
        // Coordinated Placement: Face-to-Face Lecture must strictly precede Laboratory!
        const coordRes = tryPlaceCoordinatedSubject({
          lecF2FHours: neededF2FLec,
          labHours: neededLab,
          regularDays,
          teacher: chosenTeacher,
          subject,
          section,
          semester: selectedSemester,
          candidateLecRooms,
          candidateLabRooms,
          existingBlocks: newBlocks,
          rooms,
          teachers,
          subjects,
          sections,
          asynchList
        });

        if (coordRes.placed) {
          recordPlacedSession({
            block: coordRes.lecBlock,
            room: coordRes.lecRoom,
            day: coordRes.lecDay,
            slot: coordRes.lecSlot,
            sessionType: 'Lecture',
            usedFallback: coordRes.usedFallback,
            fallbackReason: coordRes.fallbackReason,
            tier: coordRes.tier
          });
          recordPlacedSession({
            blocks: coordRes.labBlocks,
            block: coordRes.labBlock,
            room: coordRes.labRoom,
            day: coordRes.labDay,
            slot: coordRes.labSlot,
            sessionType: 'Laboratory',
            usedFallback: coordRes.usedFallback,
            fallbackReason: coordRes.fallbackReason,
            tier: coordRes.tier
          });
        } else {
          recordUnplacedSession({
            sessionType: 'Lecture & Laboratory',
            hours: neededF2FLec + neededLab,
            roomsPool: candidateLabRooms,
            reason: `⚠️ Could not place Lecture & Laboratory pair for ${section.code} - ${subject.code}: All regular room/time slots have room, teacher, or section overlaps.`
          });
        }
      } else if (neededF2FLec > 0) {
        // Face-to-Face Lecture Only (No Lab required)
        const lecRes = tryPlaceSingleSession({
          durationHours: neededF2FLec,
          candidateDays: regularDays,
          candidateRooms: candidateLecRooms,
          teacher: chosenTeacher,
          section,
          subject,
          sessionType: 'Lecture',
          deliveryMode: 'Face-to-Face',
          semester: selectedSemester,
          existingBlocks: newBlocks,
          rooms,
          teachers,
          subjects,
          sections,
          asynchList
        });

        if (lecRes.placed) {
          recordPlacedSession({ ...lecRes, sessionType: 'Lecture' });
        } else {
          recordUnplacedSession({
            sessionType: 'Lecture',
            hours: neededF2FLec,
            roomsPool: candidateLecRooms,
            reason: `⚠️ Could not place Face-to-Face Lecture (${neededF2FLec}h) for ${section.code} - ${subject.code}: All regular room/time slots have room, teacher, or section overlaps.`
          });
        }
      } else if (neededLab > 0) {
        // Laboratory Only (Face-to-Face Lecture already scheduled or not needed)
        const existingF2FLec = existingForSub.find(
          b => b.type === 'Lecture' && b.deliveryMode !== 'Asynchronous' && !asynchList.includes(b.day)
        );

        let labDays = regularDays;
        if (existingF2FLec) {
          const subsequentDays = regularDays.filter(d => DAYS.indexOf(d) > DAYS.indexOf(existingF2FLec.day));
          const sameDay = [existingF2FLec.day];
          labDays = [...subsequentDays, ...sameDay, ...regularDays.filter(d => !subsequentDays.includes(d) && !sameDay.includes(d))];
        }

        const labRes = tryPlaceSingleSession({
          durationHours: neededLab,
          candidateDays: labDays,
          candidateRooms: candidateLabRooms,
          teacher: chosenTeacher,
          section,
          subject,
          sessionType: 'Laboratory',
          deliveryMode: 'Face-to-Face',
          semester: selectedSemester,
          existingBlocks: newBlocks,
          rooms,
          teachers,
          subjects,
          sections,
          asynchList,
          isSlotValid: (day, room, slot) => {
            if (existingF2FLec && day === existingF2FLec.day) {
              const startToCheck = slot.isSplitMidday ? '10:30' : slot.start;
              return timeToMinutes(startToCheck) >= timeToMinutes(existingF2FLec.endTime);
            }
            return true;
          }
        });

        if (labRes.placed) {
          recordPlacedSession({ ...labRes, sessionType: 'Laboratory' });
        } else {
          recordUnplacedSession({
            sessionType: 'Laboratory',
            hours: neededLab,
            roomsPool: candidateLabRooms,
            reason: `⚠️ Could not place Laboratory (${neededLab}h) for ${section.code} - ${subject.code}: All room/time slots have room, teacher, or section overlaps.`
          });
        }
      }
    });

    sectionSummaries.push({ sectionCode: section.code, added: sectionAddedCount });
  });

  return {
    newBlocks,
    addedCount,
    logs,
    blockedConflictReports,
    sectionSummaries,
    fallbackSessions,
    unplacedSessions
  };
};
