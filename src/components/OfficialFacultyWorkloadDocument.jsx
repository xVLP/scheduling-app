import React from 'react';
import cbsuaHeaderImg from '../assets/cbsua_header.png';

// Standard 9 Time Slots matching the Official CBSUA Faculty Workload Document (CIT-FR-002)
const DEFAULT_WORKLOAD_TIME_SLOTS = [
  { label: '7:30 AM – 8:30', start: '07:30', end: '08:30' },
  { label: '8:30 AM – 9:30', start: '08:30', end: '09:30' },
  { label: '9:30 AM – 10:30', start: '09:30', end: '10:30' },
  { label: '10:30 AM – 11:30', start: '10:30', end: '11:30' },
  { label: '11:30 AM – 12:30', start: '11:30', end: '12:30' },
  { label: '1:00 PM – 2:00', start: '13:00', end: '14:00' },
  { label: '2:00 PM – 3:00', start: '14:00', end: '15:00' },
  { label: '3:00 PM – 4:00', start: '15:00', end: '16:00' },
  { label: '4:00 PM – 5:00', start: '16:00', end: '17:00' }
];

const EXTENDED_WORKLOAD_TIME_SLOTS = [
  ...DEFAULT_WORKLOAD_TIME_SLOTS,
  { label: '5:00 PM – 6:00', start: '17:00', end: '18:00' },
  { label: '6:00 PM – 7:00', start: '18:00', end: '19:00' }
];

const BASE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Helper to convert 'HH:MM' string to minutes
const timeToMins = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// Helper to format faculty name in official uppercase (e.g., "JUEGO, GINEO B.")
export const formatFacultyNameOfficial = (nameStr) => {
  if (!nameStr) return '';
  const clean = nameStr.replace(/^(Engr\.|Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length <= 1) return clean.toUpperCase();
  
  // If already contains comma (e.g. "JUEGO, GINEO B.")
  if (clean.includes(',')) return clean.toUpperCase();

  // Last word is surname
  const surname = parts[parts.length - 1];
  const firstAndMiddle = parts.slice(0, parts.length - 1).join(' ');
  return `${surname}, ${firstAndMiddle}`.toUpperCase();
};

export default function OfficialFacultyWorkloadDocument({
  teacher = null,
  blocks = [],
  subjects = [],
  sections = [],
  rooms = [],
  signatories = [],
  templateSettings = {},
  selectedSemester = '1st Semester'
}) {
  if (!teacher) return null;

  // 1. Filter blocks for this instructor
  const teacherBlocks = blocks.filter(b => b.teacherId === teacher.id);

  // Check if instructor has Saturday classes or evening classes
  const hasSaturday = teacherBlocks.some(b => b.day === 'Saturday');
  const printDays = hasSaturday ? [...BASE_DAYS, 'Saturday'] : BASE_DAYS;

  const hasEvening = teacherBlocks.some(b => timeToMins(b.endTime) > 1020);
  const printTimeSlots = hasEvening ? EXTENDED_WORKLOAD_TIME_SLOTS : DEFAULT_WORKLOAD_TIME_SLOTS;

  const asynchDaysList = templateSettings?.asynchronousDays || ['Wednesday'];

  // Consultation Hours definition (e.g. Tuesday & Thursday 2:00 PM - 4:00 PM)
  const consultationScheduleStr = teacher.consultationHours || 'TTH 2:00 -4:00';
  const hasTTHConsultation = /TTH|Tuesday|Thursday/i.test(consultationScheduleStr);

  // 2. Build Left Table Timetable Matrix (Handling rowSpan for multi-hour blocks)
  const gridMatrix = {};
  printDays.forEach(day => { gridMatrix[day] = {}; });

  printDays.forEach(day => {
    printTimeSlots.forEach(slot => {
      if (gridMatrix[day][slot.start]) return; // Already covered by rowSpan

      const slotStartMins = timeToMins(slot.start);
      const slotEndMins = timeToMins(slot.end);

      // Find matching class block
      const block = teacherBlocks.find(b => {
        if (b.day !== day) return false;
        const bStart = timeToMins(b.startTime);
        const bEnd = timeToMins(b.endTime);
        return slotStartMins >= bStart && slotStartMins < bEnd;
      });

      if (block) {
        const bStart = timeToMins(block.startTime);
        const bEnd = timeToMins(block.endTime);

        if (slotStartMins === bStart) {
          const durationMins = bEnd - bStart;
          const span = Math.max(1, Math.round(durationMins / 60));
          gridMatrix[day][slot.start] = { type: 'cell', block, span };

          for (let i = 1; i < span; i++) {
            const nextIdx = printTimeSlots.findIndex(s => s.start === slot.start) + i;
            if (nextIdx >= 0 && nextIdx < printTimeSlots.length) {
              gridMatrix[day][printTimeSlots[nextIdx].start] = { type: 'spanned' };
            }
          }
        }
      } else {
        // Check for Consultation Hours (default TTH 2:00 PM - 4:00 PM / 14:00 - 16:00)
        const isConsultationDay = hasTTHConsultation && (day === 'Tuesday' || day === 'Thursday');
        const isConsultationTime = slot.start === '14:00';

        if (isConsultationDay && isConsultationTime) {
          // Span 2:00 PM - 4:00 PM (2 hours = 2 slots)
          const nextSlot = printTimeSlots.find(s => s.start === '15:00');
          const hasConflictingBlockAt3 = teacherBlocks.some(b => b.day === day && timeToMins(b.startTime) < 960 && timeToMins(b.endTime) > 900);

          if (!hasConflictingBlockAt3 && nextSlot) {
            gridMatrix[day][slot.start] = { type: 'consultation', span: 2 };
            gridMatrix[day]['15:00'] = { type: 'spanned' };
          } else {
            gridMatrix[day][slot.start] = { type: 'consultation', span: 1 };
          }
        } else {
          gridMatrix[day][slot.start] = { type: 'empty', span: 1 };
        }
      }
    });
  });

  // 3. Build Right Table Workload Rows: Group by unique (subjectId, sectionId)
  const workloadMap = new Map();

  // First collect from scheduled blocks
  teacherBlocks.forEach(b => {
    if (!b.subjectId) return;
    const key = `${b.subjectId}_${b.sectionId || 'GEN'}`;
    if (!workloadMap.has(key)) {
      workloadMap.set(key, {
        subjectId: b.subjectId,
        sectionId: b.sectionId,
        blocks: []
      });
    }
    workloadMap.get(key).blocks.push(b);
  });

  // Next collect from explicit teacher assignedSectionSubjectPairs if not in map
  if (teacher.assignedSectionSubjectPairs && teacher.assignedSectionSubjectPairs.length > 0) {
    teacher.assignedSectionSubjectPairs.forEach(pair => {
      const key = `${pair.subjectId}_${pair.sectionId}`;
      if (!workloadMap.has(key)) {
        workloadMap.set(key, {
          subjectId: pair.subjectId,
          sectionId: pair.sectionId,
          blocks: []
        });
      }
    });
  }

  // Next collect from assignedSubjectIds if still empty
  if (workloadMap.size === 0 && teacher.assignedSubjectIds && teacher.assignedSubjectIds.length > 0) {
    teacher.assignedSubjectIds.forEach(subId => {
      const key = `${subId}_GEN`;
      if (!workloadMap.has(key)) {
        workloadMap.set(key, {
          subjectId: subId,
          sectionId: null,
          blocks: []
        });
      }
    });
  }

  // Compile detailed workload items
  const workloadItems = Array.from(workloadMap.values()).map(item => {
    const sub = subjects.find(s => s.id === item.subjectId);
    const sec = sections.find(s => s.id === item.sectionId);

    const units = sub?.units || 3;
    const yrSec = sec?.code || (sec?.yearLevel ? `${sec.yearLevel}A` : '-');
    const noOfStud = sec?.studentsCount || sec?.noOfStudents || '';
    const totalHours = sub?.totalHours || ((sub?.lecHours || 0) + (sub?.labHours || 0)) || 3;
    const lecHours = sub?.lecHours || 0;
    const labHours = (sub?.labHours > 0) ? sub.labHours : '-';

    // Face-to-Face Teaching hours computation:
    // Matches CBSUA institutional policy shown in official form:
    // E.g., for 3hr Lecture course with 1hr asynch: 2 hrs F2F
    // E.g., for 2hr Lecture course with 1hr asynch: 1 hr F2F
    const f2fTeachingHrs = (() => {
      const f2fBlocks = item.blocks.filter(b => b.type === 'Lecture' && b.deliveryMode !== 'Asynchronous' && !asynchDaysList.includes(b.day));
      const f2fMins = f2fBlocks.reduce((sum, b) => sum + (timeToMins(b.endTime) - timeToMins(b.startTime)), 0);
      if (f2fMins > 0) return Math.round(f2fMins / 60);
      
      // Expected by policy if not yet scheduled
      if (sub?.lecHours === 2) return 1;
      if (sub?.lecHours === 3 && asynchDaysList.length > 0) return 2;
      return sub?.lecHours || 0;
    })();

    return {
      workload: sub?.code || 'SUBJ',
      units,
      yrSec,
      noOfStud,
      totalHours,
      lecHours,
      labHours,
      f2fTeachingHrs,
      week: '1-18'
    };
  });

  // Totals Calculation
  const totalUnits = workloadItems.reduce((sum, item) => sum + Number(item.units || 0), 0);
  const totalLecHours = workloadItems.reduce((sum, item) => sum + Number(item.lecHours || 0), 0);
  const totalLabHours = workloadItems.reduce((sum, item) => sum + (typeof item.labHours === 'number' ? item.labHours : 0), 0);
  const totalF2FHours = workloadItems.reduce((sum, item) => sum + Number(item.f2fTeachingHrs || 0), 0);

  // Administrative / Special Designation (e.g. ICT Coordinator, 3 hours)
  const designationTitle = teacher.designation || (teacher.employmentType === 'Permanent' ? 'ICT Coordinator' : null);
  const designationHours = designationTitle ? (teacher.designationHours || 3) : 0;
  const totalTeachingHours = workloadItems.reduce((sum, item) => sum + Number(item.totalHours || 0), 0) + designationHours;

  // Target minimum rows to match timetable height
  const minRows = 8;
  const emptyRowsCount = Math.max(0, minRows - workloadItems.length - (designationTitle ? 2 : 1));

  return (
    <div
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      className="official-template-wrapper bg-white text-black p-4 sm:p-5 print:p-0 max-w-6xl mx-auto border border-slate-300 rounded-xl shadow-md my-4 print:my-0 print:border-none print:shadow-none w-full box-border"
    >
      {/* 1. TOP OFFICIAL CBSUA HEADER IMAGE */}
      <div className="w-full mb-1 border-b border-black pb-1">
        <img
          src={cbsuaHeaderImg}
          alt="Central Bicol State University of Agriculture Header"
          className="w-full h-auto object-contain block max-w-full"
        />
      </div>

      {/* 2. COLLEGE & FACULTY WORKLOAD TITLE BLOCK */}
      <div className="text-center my-1.5 space-y-0.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-black">
          {templateSettings.collegeName || 'COLLEGE OF INFORMATION TECHNOLOGY'}
        </h2>
        <h1 className="text-sm font-bold tracking-widest text-black uppercase">
          FACULTY WORKLOAD
        </h1>
        <div className="text-xs font-bold text-black">
          {selectedSemester || '1st Semester'}, SY {templateSettings.schoolYear ? templateSettings.schoolYear.replace(/^SY\s*/i, '') : '2026 - 2027'}
        </div>
      </div>

      {/* 3. NAME OF FACULTY LINE */}
      <div className="text-left font-bold text-xs mb-1.5 text-black">
        Name of Faculty:{' '}
        <u className="font-extrabold text-sm px-1 text-black tracking-wide">
          {formatFacultyNameOfficial(teacher.name)}
        </u>
      </div>

      {/* 4. MAIN SIDE-BY-SIDE TABLES (Weekly Timetable on Left, Workload Summary on Right) */}
      <div className="flex flex-row gap-2 justify-between items-start w-full box-border">
        {/* LEFT TABLE: WEEKLY TIMETABLE GRID (50% Width) */}
        <table
          style={{ width: 'calc(50% - 4px)', tableLayout: 'fixed' }}
          className="border-collapse border border-black text-center text-black box-border"
        >
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-black">
              <th style={{ width: '18%' }} className="border border-black px-0.5 py-1 uppercase text-[8.5px] bg-slate-200/80">
                TIME
              </th>
              {printDays.map(day => (
                <th
                  key={day}
                  style={{ width: `${82 / printDays.length}%` }}
                  className="border border-black px-0.5 py-1 uppercase text-[8.5px]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {printTimeSlots.map(slot => (
              <tr key={slot.start} className="border-b border-black">
                {/* Time Slot Label */}
                <td className="border border-black px-0.5 py-1 font-bold bg-slate-50 whitespace-nowrap text-[8px] leading-tight text-center">
                  {slot.label}
                </td>

                {/* Day Columns */}
                {printDays.map(day => {
                  const cellData = gridMatrix[day][slot.start];
                  if (!cellData || cellData.type === 'spanned') return null;

                  if (cellData.type === 'cell') {
                    const block = cellData.block;
                    const sub = subjects.find(s => s.id === block.subjectId);
                    const sec = sections.find(s => s.id === block.sectionId);
                    const room = rooms.find(r => r.id === block.roomId);

                    const isAsynch = block.deliveryMode === 'Asynchronous' || asynchDaysList.includes(day);
                    const displayRoom = isAsynch ? 'Asynchronous' : (room?.name ? room.name.split(' ')[0] : 'Room');

                    return (
                      <td
                        key={day}
                        rowSpan={cellData.span}
                        className="border border-black p-0.5 text-center align-middle font-bold leading-tight bg-slate-50/50"
                      >
                        <div className="font-extrabold text-[8.5px] text-black leading-tight">
                          {sub?.code || 'IT'} [{sec?.code || ''}]
                        </div>
                        <div className="text-[7.5px] text-slate-800 font-semibold mt-0.5 leading-tight">
                          {displayRoom}
                        </div>
                      </td>
                    );
                  }

                  if (cellData.type === 'consultation') {
                    return (
                      <td
                        key={day}
                        rowSpan={cellData.span}
                        className="border border-black p-0.5 text-center align-middle font-bold leading-tight bg-amber-50/40"
                      >
                        <div className="text-[8px] font-bold text-slate-800 leading-tight">
                          Consultation
                        </div>
                        <div className="text-[7.5px] font-normal text-slate-700">
                          Hours
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={day} className="border border-black p-0.5 text-slate-300">
                      &nbsp;
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* RIGHT TABLE: WORKLOAD SUMMARY TABLE (50% Width) */}
        <table
          style={{ width: 'calc(50% - 4px)', tableLayout: 'fixed' }}
          className="border-collapse border border-black text-center text-black box-border"
        >
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-black">
              <th style={{ width: '16%' }} className="border border-black px-0.5 py-1 text-[7.5px] uppercase">Workload</th>
              <th style={{ width: '10%' }} className="border border-black px-0.5 py-1 text-[7px] leading-tight uppercase">No. of units</th>
              <th style={{ width: '10%' }} className="border border-black px-0.5 py-1 text-[7.5px] leading-tight uppercase">Yr. & Sec.</th>
              <th style={{ width: '9%' }} className="border border-black px-0.5 py-1 text-[7px] leading-tight uppercase">No. of Stud.</th>
              <th style={{ width: '10%' }} className="border border-black px-0.5 py-1 text-[7.5px] leading-tight uppercase">No. of Hours</th>
              <th style={{ width: '11%' }} className="border border-black px-0.5 py-1 text-[7.5px] leading-tight uppercase">Lec. (Hrs.)</th>
              <th style={{ width: '11%' }} className="border border-black px-0.5 py-1 text-[7.5px] leading-tight uppercase">Lab. (Hrs.)</th>
              <th style={{ width: '14%' }} className="border border-black px-0.5 py-1 text-[6.5px] leading-tight uppercase">Face to face Teaching (Hrs)</th>
              <th style={{ width: '9%' }} className="border border-black px-0.5 py-1 text-[7.5px] uppercase">Week</th>
            </tr>
          </thead>
          <tbody>
            {/* Teaching Subject Workload Rows */}
            {workloadItems.map((item, idx) => (
              <tr key={idx} className="border-b border-black">
                <td className="border border-black px-0.5 py-1 font-bold text-[8px] text-center">{item.workload}</td>
                <td className="border border-black px-0.5 py-1 font-normal text-[8px] text-center">{item.units}</td>
                <td className="border border-black px-0.5 py-1 font-bold text-[8px] text-center">{item.yrSec}</td>
                <td className="border border-black px-0.5 py-1 font-normal text-[8px] text-center">{item.noOfStud}</td>
                <td className="border border-black px-0.5 py-1 font-normal text-[8px] text-center">{item.totalHours}</td>
                <td className="border border-black px-0.5 py-1 font-normal text-[8px] text-center">{item.lecHours}</td>
                <td className="border border-black px-0.5 py-1 font-normal text-[8px] text-center">{item.labHours}</td>
                <td className="border border-black px-0.5 py-1 font-bold text-[8px] text-center">{item.f2fTeachingHrs}</td>
                <td className="border border-black px-0.5 py-1 font-normal text-[7.5px] text-center">{item.week}</td>
              </tr>
            ))}

            {/* Empty Spacer Rows */}
            {Array.from({ length: emptyRowsCount }).map((_, idx) => (
              <tr key={`empty-${idx}`} className="border-b border-black">
                <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
                <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
                <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
                <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
                <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
                <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
                <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
                <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
                <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
              </tr>
            ))}

            {/* Consultation Hours Row */}
            <tr className="border-b border-black">
              <td className="border border-black px-1 py-1 font-bold text-[8px] text-left">Consultation</td>
              <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
              <td colSpan={2} className="border border-black px-1 py-1 font-semibold text-[7.5px] text-center whitespace-nowrap">
                {consultationScheduleStr}
              </td>
              <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
              <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
              <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
              <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
              <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
            </tr>

            {/* Special Designation Row (e.g., ICT Coordinator) */}
            {designationTitle && (
              <tr className="border-b border-black">
                <td colSpan={4} className="border border-black px-1 py-1 font-bold text-[8px] text-left">
                  {designationTitle}
                </td>
                <td className="border border-black px-0.5 py-1 font-bold text-[8px] text-center">
                  {designationHours}
                </td>
                <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
                <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
                <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
                <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
              </tr>
            )}

            {/* TOTAL Summary Row */}
            <tr className="bg-slate-100 font-bold border-b border-black">
              <td className="border border-black px-1 py-1 text-center font-black text-[8.5px]">TOTAL</td>
              <td className="border border-black px-0.5 py-1 text-center font-black text-[8.5px]">{totalUnits}</td>
              <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
              <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
              <td className="border border-black px-0.5 py-1 text-center font-black text-[8px]">{totalTeachingHours > 0 ? totalTeachingHours : ''}</td>
              <td className="border border-black px-0.5 py-1 text-center font-black text-[8.5px]">{totalLecHours}</td>
              <td className="border border-black px-0.5 py-1 text-center font-black text-[8.5px]">{totalLabHours}</td>
              <td className="border border-black px-0.5 py-1 text-center font-black text-[8.5px]">{totalF2FHours}</td>
              <td className="border border-black p-0.5 text-[8px]">&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. EDITABLE SIGNATORIES SECTION (5 Signatories) */}
      <div className="grid grid-cols-5 gap-2 mt-4 pt-1 text-[9px] text-black w-full box-border">
        {signatories.map((sig, idx) => (
          <div key={sig.id || idx} className="flex flex-col justify-between space-y-2 text-left">
            <div className="font-bold text-black text-[8.5px]">{sig.label}</div>
            <div className="mt-1">
              <div className="font-bold uppercase text-black border-b border-black inline-block pb-0.5 w-full truncate text-[9px]">
                {sig.name}
              </div>
              <div className="text-[8px] text-slate-800 font-normal truncate mt-0.5">{sig.title}</div>
              <div className="text-[7.5px] text-slate-600 mt-1">Date Signed: ____________</div>
            </div>
          </div>
        ))}
      </div>

      {/* 6. DOCUMENT CONTROL FOOTER (CIT-FR-002) */}
      <div className="flex items-center justify-between text-[8px] text-slate-800 border-t border-black mt-3 pt-1 font-sans">
        <div>
          <span className="font-black text-black">CIT-FR-002</span>
          <span className="mx-1.5">•</span>
          <span>Effectivity Date: September 5, 2025</span>
        </div>
        <div>
          <span>Rev.: {templateSettings.revisionNo || '2'}</span>
          <span className="mx-1.5">•</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}
