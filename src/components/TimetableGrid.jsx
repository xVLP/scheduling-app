import React from 'react';
import { AlertTriangle, Clock, MapPin, User, Users, BookOpen, Trash2, Plus, Utensils, ArrowDownRight } from 'lucide-react';
import { timeToMinutes, COLLEGE_TIME_SLOTS, doTimesOverlap, formatTime12 } from '../utils/conflictChecker';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableGrid({
  blocks = [],
  subjects = [],
  teachers = [],
  rooms = [],
  sections = [],
  conflicts = {},
  asynchronousDays = ['Wednesday'],
  onCellClick,
  onBlockClick,
  onDeleteBlock,
  viewMode = 'master', // 'master' | 'section' | 'instructor' | 'room'
  filterId = null
}) {
  const asynchList = Array.isArray(asynchronousDays)
    ? asynchronousDays
    : (asynchronousDays?.asynchronousDays || ['Wednesday']);

  // Filter blocks according to viewMode & filterId
  const filteredBlocks = blocks.filter(block => {
    if (!filterId) return true;
    if (viewMode === 'section') return block.sectionId === filterId;
    if (viewMode === 'instructor') return block.teacherId === filterId;
    if (viewMode === 'room') return block.roomId === filterId;
    return true;
  });

  const getSubject = id => subjects.find(s => s.id === id);
  const getTeacher = id => teachers.find(t => t.id === id);
  const getRoom = id => rooms.find(r => r.id === id);
  const getSection = id => sections.find(s => s.id === id);

  return (
    <div className="bg-white border border-emerald-100 rounded-2xl shadow-xl overflow-hidden font-poppins">
      {/* Timetable Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[950px]">
          <thead>
            <tr className="bg-emerald-900 border-b border-emerald-950 text-white">
              <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-left w-36 border-r border-emerald-800 sticky left-0 bg-emerald-900 z-10">
                Time Slot
              </th>
              {DAYS.map(day => (
                <th key={day} className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-center border-r border-emerald-800 last:border-r-0">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span>{day}</span>
                    {asynchList.includes(day) && (
                      <span className="px-2 py-0.5 text-[9px] font-black bg-amber-400 text-emerald-950 rounded-full tracking-normal normal-case shadow-sm">
                        ⚡ Asynch (No Lab)
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-100 text-xs">
            {(() => {
              const nonLunchSlots = COLLEGE_TIME_SLOTS.filter(s => !s.isLunch);

              const getSlotsSpannedCount = (block, startSlotIdx) => {
                const bEnd = timeToMinutes(block.endTime);
                let count = 0;
                for (let i = startSlotIdx; i < nonLunchSlots.length; i++) {
                  const sStart = timeToMinutes(nonLunchSlots[i].start);
                  if (doTimesOverlap(block.startTime, block.endTime, nonLunchSlots[i].start, nonLunchSlots[i].end)) {
                    count++;
                  } else if (sStart >= bEnd) {
                    break;
                  }
                }
                return Math.max(count, 1);
              };

              const isCellCoveredByPreviousRow = (day, currentSlotIdx) => {
                for (let i = 0; i < currentSlotIdx; i++) {
                  const slot = nonLunchSlots[i];
                  const slotStartMins = timeToMinutes(slot.start);
                  const slotEndMins = timeToMinutes(slot.end);

                  const blocksAtSlot = filteredBlocks.filter(b => {
                    if (b.day !== day) return false;
                    const bStart = timeToMinutes(b.startTime);
                    return bStart >= slotStartMins && bStart < slotEndMins;
                  });

                  if (blocksAtSlot.length > 0) {
                    const maxSpanned = Math.max(...blocksAtSlot.map(b => getSlotsSpannedCount(b, i)));
                    if (currentSlotIdx < i + maxSpanned) {
                      return true; // Covered by rowSpan above
                    }
                  }
                }
                return false;
              };

              return COLLEGE_TIME_SLOTS.map(slot => {
                if (slot.isLunch) {
                  return (
                    <tr key={slot.id} className="bg-amber-50 border-y border-amber-200 text-amber-900 font-medium">
                      <td className="py-2.5 px-3 font-mono font-bold text-[11px] bg-amber-100/80 border-r border-amber-200 sticky left-0 z-10 whitespace-nowrap text-amber-900">
                        <div className="flex items-center space-x-1.5">
                          <Utensils className="w-3.5 h-3.5 text-amber-700" />
                          <span>{slot.start} - {slot.end}</span>
                        </div>
                      </td>
                      <td colSpan={6} className="py-2.5 text-center text-xs font-extrabold tracking-widest uppercase text-amber-800">
                        — LUNCH BREAK (12:30 PM - 1:00 PM) —
                      </td>
                    </tr>
                  );
                }

                const slotStartMins = timeToMinutes(slot.start);
                const slotEndMins = timeToMinutes(slot.end);
                const nonLunchIdx = nonLunchSlots.findIndex(s => s.id === slot.id);

                return (
                  <tr key={slot.id} className="hover:bg-emerald-50/40 transition-colors group">
                    {/* Hour Slot Header */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-700 bg-slate-100/90 border-r border-slate-200 sticky left-0 z-10 whitespace-nowrap text-xs">
                      {slot.label}
                    </td>

                    {/* Day Columns */}
                    {DAYS.map(day => {
                      // Check if this cell is covered by a rowSpan from a previous row
                      if (nonLunchIdx > 0 && isCellCoveredByPreviousRow(day, nonLunchIdx)) {
                        return null; // Skip rendering td since rowSpan above covers this slot!
                      }

                      // Find blocks that START in this time slot
                      const startingBlocks = filteredBlocks.filter(b => {
                        if (b.day !== day) return false;
                        const bStart = timeToMinutes(b.startTime);
                        return bStart >= slotStartMins && bStart < slotEndMins;
                      });

                      const rowSpan = startingBlocks.length > 0 
                        ? Math.max(...startingBlocks.map(b => getSlotsSpannedCount(b, nonLunchIdx)))
                        : 1;

                      return (
                        <td
                          key={day}
                          rowSpan={rowSpan}
                          onClick={() => onCellClick && onCellClick(day, slot.start)}
                          className="p-1.5 border-r border-slate-200/80 last:border-r-0 align-top relative hover:bg-emerald-50/60 transition-colors cursor-pointer bg-white"
                        >
                          {startingBlocks.length === 0 ? (
                            <div className="h-20 w-full flex items-center justify-center opacity-0 group-hover:opacity-40 transition-opacity">
                              <Plus className="w-4 h-4 text-emerald-600" />
                            </div>
                          ) : (
                            <div className="space-y-1.5 h-full flex flex-col justify-between">
                              {startingBlocks.map(block => {
                                const sub = getSubject(block.subjectId);
                                const teacher = getTeacher(block.teacherId);
                                const room = getRoom(block.roomId);
                                const sec = getSection(block.sectionId);
                                const blockConflicts = conflicts[block.id] || [];

                                const hasError = blockConflicts.some(c => c.type === 'error');
                                const hasWarning = blockConflicts.some(c => c.type === 'warning');

                                // Calculate block duration in hours
                                const dur = (timeToMinutes(block.endTime) - timeToMinutes(block.startTime)) / 60;
                                const timeSpan12 = `${formatTime12(block.startTime)} - ${formatTime12(block.endTime)}`;
                                const isAsynch = block.deliveryMode === 'Asynchronous' || (asynchList.includes(block.day) && block.type === 'Lecture');

                                return (
                                  <div
                                    key={block.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onBlockClick && onBlockClick(block);
                                    }}
                                    style={{
                                      borderLeftColor: sub?.color || '#059669',
                                      minHeight: `${rowSpan * 92 - 12}px`
                                    }}
                                    className={`p-3 rounded-2xl shadow-md border border-slate-200 transition-all transform hover:-translate-y-0.5 hover:shadow-lg relative border-l-4 group/card h-full flex flex-col justify-between ${
                                      hasError
                                        ? 'bg-rose-50/95 border-rose-400 ring-2 ring-rose-500/40 animate-pulse text-rose-950'
                                        : hasWarning
                                        ? 'bg-amber-50/95 border-amber-400 ring-1 ring-amber-500/30 text-amber-950'
                                        : isAsynch
                                        ? 'bg-amber-50/40 hover:bg-amber-50/70 text-slate-800'
                                        : 'bg-white hover:bg-slate-50 text-slate-800'
                                    }`}
                                  >
                                    <div>
                                      {/* Top Row: Subject Code & Session Type */}
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-extrabold text-xs text-slate-900 tracking-wide">
                                          {sub?.code || 'SUBJ'}
                                        </span>
                                        <span
                                          className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wider ${
                                            block.type === 'Laboratory'
                                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                              : isAsynch
                                              ? 'bg-amber-300 text-emerald-950 border border-amber-400 font-black'
                                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                          }`}
                                        >
                                          {block.type === 'Laboratory' ? '🔬 LAB' : isAsynch ? '⚡ ASYNCH' : '🏛️ LEC'}
                                        </span>
                                      </div>

                                      {/* Subject Title */}
                                      <div className="text-slate-600 font-medium line-clamp-2 mb-1.5 text-[11px]">
                                        {sub?.name || 'Subject Title'}
                                      </div>

                                      {/* Details Grid */}
                                      <div className="space-y-1 text-[10px] text-slate-600">
                                        <div className="flex items-center space-x-1 font-extrabold text-emerald-950 bg-emerald-50 p-1 rounded-md border border-emerald-200">
                                          <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                                          <span>
                                            {timeSpan12} ({dur}h {isAsynch ? 'Asynch' : 'F2F'})
                                          </span>
                                        </div>

                                        {viewMode !== 'section' && (
                                          <div className="flex items-center space-x-1">
                                            <Users className="w-3 h-3 text-emerald-600 shrink-0" />
                                            <span className="font-bold text-emerald-800">{sec?.code || 'N/A'}</span>
                                          </div>
                                        )}

                                        {viewMode !== 'instructor' && (
                                          <div className="flex items-center space-x-1">
                                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                                            <span className="truncate font-medium">{teacher?.name || 'Unassigned'}</span>
                                          </div>
                                        )}

                                        {viewMode !== 'room' && (
                                          <div className="flex items-center space-x-1">
                                            {isAsynch ? (
                                              <span className="text-[10px] text-amber-700 font-bold tracking-tight">
                                                ⚡ No Room (Asynch)
                                              </span>
                                            ) : (
                                              <>
                                                <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                                                <span className="truncate font-bold text-amber-800">
                                                  {room?.name || 'No Room'}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* SPECIFIC CONFLICT DETAILS DIRECTLY VISIBLE ON CARD */}
                                      {blockConflicts.length > 0 && (
                                        <div className="mt-2 pt-1.5 border-t border-rose-200/80 space-y-1">
                                          {blockConflicts.map((c, i) => (
                                            <div
                                              key={i}
                                              title={c.message}
                                              className={`px-2 py-1 rounded-lg text-[10px] font-bold leading-tight flex items-start space-x-1 shadow-2xs ${
                                                c.type === 'error'
                                                  ? 'bg-rose-100 text-rose-950 border border-rose-300'
                                                  : 'bg-amber-100 text-amber-950 border border-amber-300'
                                              }`}
                                            >
                                              <AlertTriangle className={`w-3 h-3 shrink-0 mt-0.5 ${c.type === 'error' ? 'text-rose-600' : 'text-amber-600'}`} />
                                              <span className="line-clamp-2">
                                                {c.shortMessage || c.message}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Bottom Area: Conflict Alert & Delete */}
                                    <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                      {(hasError || hasWarning) ? (
                                        <div className="flex items-center space-x-1 font-black text-[10px]">
                                          <AlertTriangle className={`w-3 h-3 ${hasError ? 'text-rose-600' : 'text-amber-600'}`} />
                                          <span className={hasError ? 'text-rose-700' : 'text-amber-700'}>
                                            {blockConflicts.length} Conflict{blockConflicts.length > 1 ? 's' : ''} (Resolve)
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                                          Span: {dur} hrs
                                        </span>
                                      )}

                                      {/* Hover Delete Action */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteBlock && onDeleteBlock(block.id);
                                        }}
                                        title="Delete schedule block"
                                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
