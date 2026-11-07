import React from 'react';
import cbsuaHeaderImg from '../assets/cbsua_header.png';

// Official Time Slots matching CBSUA Class Schedule Format
const PRINT_TIME_SLOTS = [
  { label: '7:30-8:30', start: '07:30', end: '08:30' },
  { label: '8:30-9:30', start: '08:30', end: '09:30' },
  { label: '9:30-10:30', start: '09:30', end: '10:30' },
  { label: '10:30-11:30', start: '10:30', end: '11:30' },
  { label: '11:30-12:30', start: '11:30', end: '12:30' },
  { label: '1:00-2:00', start: '13:00', end: '14:00' },
  { label: '2:00-3:00', start: '14:00', end: '15:00' },
  { label: '3:00-4:00', start: '15:00', end: '16:00' },
  { label: '4:00-5:00', start: '16:00', end: '17:00' },
  { label: '5:00-6:00', start: '17:00', end: '18:00' },
  { label: '6:00-7:00', start: '18:00', end: '19:00' }
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to check if a block covers a time slot
const timeToMins = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export default function OfficialClassScheduleDocument({
  section = null,
  blocks = [],
  subjects = [],
  teachers = [],
  rooms = [],
  signatories = [],
  templateSettings = {},
  selectedSemester = '1st Semester'
}) {
  const sectionBlocks = blocks.filter(b => b.sectionId === section?.id);

  // Build Grid Cells (handling row spans & multi-hour subjects)
  const gridMatrix = {};
  DAYS.forEach(day => { gridMatrix[day] = {}; });

  DAYS.forEach(day => {
    PRINT_TIME_SLOTS.forEach(slot => {
      if (gridMatrix[day][slot.start]) return; // Skip if already merged

      const slotStartMins = timeToMins(slot.start);
      const slotEndMins = timeToMins(slot.end);

      // Find matching block for this day and slot
      const block = sectionBlocks.find(b => {
        if (b.day !== day) return false;
        const bStart = timeToMins(b.startTime);
        const bEnd = timeToMins(b.endTime);
        return slotStartMins >= bStart && slotStartMins < bEnd;
      });

      if (block) {
        const bStart = timeToMins(block.startTime);
        const bEnd = timeToMins(block.endTime);

        if (slotStartMins === bStart) {
          // Calculate rowSpan (how many 1-hour slots it spans)
          const durationMins = bEnd - bStart;
          const span = Math.max(1, Math.round(durationMins / 60));

          gridMatrix[day][slot.start] = { type: 'cell', block, span };

          // Mark subsequent spanned slots as 'spanned'
          for (let i = 1; i < span; i++) {
            const nextIndex = PRINT_TIME_SLOTS.findIndex(s => s.start === slot.start) + i;
            if (nextIndex >= 0 && nextIndex < PRINT_TIME_SLOTS.length) {
              const nextSlotStart = PRINT_TIME_SLOTS[nextIndex].start;
              gridMatrix[day][nextSlotStart] = { type: 'spanned' };
            }
          }
        }
      } else {
        gridMatrix[day][slot.start] = { type: 'empty', span: 1 };
      }
    });
  });

  // Subjects in this section's schedule for the right-side summary table
  const scheduledSubjectIds = Array.from(new Set(sectionBlocks.map(b => b.subjectId)));
  const sectionSubjects = subjects.filter(s => scheduledSubjectIds.includes(s.id));

  // Exactly 11 rows for the right table to match the 11 time slot rows of the left table
  const displaySubjects = [...sectionSubjects];
  while (displaySubjects.length < PRINT_TIME_SLOTS.length) {
    displaySubjects.push(null);
  }

  return (
    <div
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      className="official-template-wrapper bg-white text-black p-5 print:p-0 max-w-6xl mx-auto border border-slate-300 rounded-xl shadow-md my-4 print:my-0 print:border-none print:shadow-none w-full box-border"
    >
      {/* 1. TOP OFFICIAL CBSUA BANNER HEADER IMAGE */}
      <div className="w-full mb-1 border-b border-black pb-1">
        <img
          src={cbsuaHeaderImg}
          alt="Central Bicol State University of Agriculture Header"
          className="w-full h-auto object-contain block max-w-full"
        />
      </div>

      {/* 2. COLLEGE & COURSE TITLE BLOCK */}
      <div className="text-center my-1.5 space-y-0.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-black">
          {templateSettings.collegeName || 'COLLEGE OF INFORMATION TECHNOLOGY'}
        </h2>
        <h1 className="text-sm font-bold tracking-widest text-black uppercase">
          CLASS SCHEDULE
        </h1>
        <div className="text-xs font-bold text-black">
          Course: <u className="font-bold uppercase">{section?.program || 'Bachelor of Science in Information Technology'}</u>
        </div>
        <div className="text-xs font-bold text-black">
          {selectedSemester || '1st Semester'}, {templateSettings.schoolYear || 'SY 2024 – 2025'}
        </div>
      </div>

      {/* 3. YEAR & SECTION LINE */}
      <div className="text-left font-bold text-xs mb-1 text-black">
        Year & Section: <u className="font-bold text-sm px-2 text-black">{section?.code || '1A'}</u>
      </div>

      {/* 4. MAIN SIDE-BY-SIDE TABLES WRAPPER (65% / 35% Proportion with exact calculated widths) */}
      <div className="flex flex-row gap-2 justify-between items-start w-full box-border">
        {/* LEFT TABLE: 6-DAY TIMETABLE GRID */}
        <table 
          style={{ width: 'calc(65% - 4px)', tableLayout: 'fixed' }}
          className="border-collapse border border-black text-center text-black box-border"
        >
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-black">
              <th style={{ width: '14%' }} className="border border-black px-0.5 py-1 bg-slate-200/80 uppercase text-[8.5px]">TIME</th>
              {DAYS.map(day => (
                <th key={day} style={{ width: '14.33%' }} className="border border-black px-0.5 py-1 uppercase text-[8.5px]">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRINT_TIME_SLOTS.map(slot => (
              <tr key={slot.start} className="border-b border-black">
                {/* Time Column */}
                <td className="border border-black px-0.5 py-0.5 font-bold bg-slate-50 whitespace-nowrap text-[8px] leading-tight">
                  {slot.label}
                </td>

                {/* Day Cells */}
                {DAYS.map(day => {
                  const cellData = gridMatrix[day][slot.start];
                  if (!cellData || cellData.type === 'spanned') return null;

                  if (cellData.type === 'cell') {
                    const block = cellData.block;
                    const sub = subjects.find(s => s.id === block.subjectId);
                    const teacher = teachers.find(t => t.id === block.teacherId);
                    const room = rooms.find(r => r.id === block.roomId);

                    const shortTeacherName = teacher
                      ? `${teacher.name.split(' ')[0][0]}. ${teacher.name.split(' ').pop()}`
                      : '';

                    const isAsynchBlock = block.deliveryMode === 'Asynchronous' || (templateSettings?.asynchronousDays || ['Wednesday']).includes(day);
                    const displayRoomStr = isAsynchBlock ? '' : (room ? room.name.split(' ')[0] : '');

                    return (
                      <td
                        key={day}
                        rowSpan={cellData.span}
                        className="border border-black p-0.5 text-center align-middle font-bold leading-tight bg-slate-50/50"
                      >
                        <div className="font-bold text-[8.5px] text-black leading-tight">
                          {sub?.code || 'Subject'}{displayRoomStr ? ` (${displayRoomStr})` : ''}
                        </div>
                        {shortTeacherName && (
                          <div className="text-[7.5px] text-slate-800 font-normal mt-0.5 leading-tight">
                            {shortTeacherName}
                          </div>
                        )}
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

        {/* RIGHT TABLE: SUBJECT SUMMARY LIST */}
        <table 
          style={{ width: 'calc(35% - 4px)', tableLayout: 'fixed' }}
          className="border-collapse border border-black text-center shrink-0 text-black box-border"
        >
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-black">
              <th style={{ width: '30%' }} className="border border-black px-0.5 py-1 uppercase text-[8px]">SUBJECT</th>
              <th style={{ width: '48%' }} className="border border-black px-0.5 py-1 text-[7.5px] leading-tight uppercase">Face to Face Teaching (HRS)</th>
              <th style={{ width: '22%' }} className="border border-black px-0.5 py-1 text-[8px] uppercase">Week</th>
            </tr>
          </thead>
          <tbody>
            {displaySubjects.map((sub, idx) => {
              if (!sub) {
                return (
                  <tr key={`empty-${idx}`} className="border-b border-black">
                    <td className="border border-black p-0.5 text-[8.5px]">&nbsp;</td>
                    <td className="border border-black p-0.5 text-[8.5px]">&nbsp;</td>
                    <td className="border border-black p-0.5 text-[8.5px]">&nbsp;</td>
                  </tr>
                );
              }

              const subBlocks = sectionBlocks.filter(b => b.subjectId === sub.id);
              const asynchDaysList = templateSettings?.asynchronousDays || ['Wednesday'];
              const f2fBlocks = subBlocks.filter(b => b.deliveryMode !== 'Asynchronous' && !asynchDaysList.includes(b.day));
              const f2fHrs = f2fBlocks.reduce((acc, b) => {
                const [h1, m1] = b.startTime.split(':').map(Number);
                const [h2, m2] = b.endTime.split(':').map(Number);
                return acc + (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
              }, 0);

              // For 2-hour lecture courses: 1 hour is F2F + lab hours
              const expectedF2FHrs = sub.lecHours === 2
                ? (1 + (sub.labHours || 0))
                : (sub.lecHours || 0) + (sub.labHours || 0);

              const contactHrs = f2fHrs > 0 ? f2fHrs : expectedF2FHrs;

              return (
                <tr key={sub.id || idx} className="border-b border-black">
                  <td className="border border-black px-0.5 py-0.5 font-bold text-[8.5px]">{sub.code}</td>
                  <td className="border border-black px-0.5 py-0.5 font-normal text-[8.5px]">{contactHrs > 0 ? `${contactHrs}` : ''}</td>
                  <td className="border border-black px-0.5 py-0.5 font-normal text-[8px]">1–18</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. EDITABLE SIGNATORIES SECTION AT BOTTOM */}
      <div className="grid grid-cols-5 gap-2 mt-4 pt-2 text-[9.5px] text-black w-full box-border">
        {signatories.map((sig, idx) => (
          <div key={sig.id || idx} className="flex flex-col justify-between space-y-3 text-left">
            <div className="font-bold text-black text-[9px]">{sig.label}</div>
            <div className="mt-2">
              <div className="font-bold uppercase text-black border-b border-black inline-block pb-0.5 w-full truncate text-[9.5px]">
                {sig.name}
              </div>
              <div className="text-[8.5px] text-slate-800 font-normal truncate mt-0.5">{sig.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 6. FOOTER DOCUMENT CODE METADATA LINE */}
      <div className="flex items-center justify-between text-[8.5px] text-slate-800 border-t border-black mt-2 pt-1 font-sans">
        <div>
          <span className="font-bold">{templateSettings.documentCode || 'CIT-FR-001'}</span> | Effectivity Date: {templateSettings.effectivityDate || 'June 3, 2024'}
        </div>
        <div>
          Rev.: {templateSettings.revisionNo || '2'} | Page 1 of 1
        </div>
      </div>
    </div>
  );
}
