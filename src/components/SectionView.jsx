import React, { useState } from 'react';
import { Users, Printer, Download, BookOpen, Clock, CheckCircle2, Edit3, FileText, LayoutGrid } from 'lucide-react';
import TimetableGrid from './TimetableGrid';
import OfficialClassScheduleDocument from './OfficialClassScheduleDocument';
import TemplateSettingsModal from './TemplateSettingsModal';
import { exportToCSV } from '../utils/exporter';

export default function SectionView({
  sections = [],
  subjects = [],
  teachers = [],
  rooms = [],
  blocks = [],
  conflicts = {},
  signatories = [],
  templateSettings = {},
  selectedSemester = '1st Semester',
  onSaveSignatories,
  onSaveTemplateSettings,
  onResetSignatories
}) {
  const [yearLevelFilter, setYearLevelFilter] = useState('ALL');
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id || '');
  const [viewMode, setViewMode] = useState('official'); // 'official' | 'grid'
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const filteredSections = sections.filter(sec => {
    if (yearLevelFilter !== 'ALL' && String(sec.yearLevel) !== String(yearLevelFilter)) {
      return false;
    }
    return true;
  });

  const currentSection = filteredSections.find(s => s.id === selectedSectionId) || filteredSections[0] || sections[0];
  const sectionBlocks = blocks.filter(b => b.sectionId === currentSection?.id);

  // Group blocks by subject to compute hours scheduled vs required
  const asynchDaysList = templateSettings?.asynchronousDays || ['Wednesday'];

  // Group blocks by subject to compute hours scheduled vs required (including 2-hour lecture policy)
  const subjectBreakdown = subjects.map(sub => {
    const subBlocks = sectionBlocks.filter(b => b.subjectId === sub.id);
    const scheduledLecF2F = subBlocks
      .filter(b => b.type === 'Lecture' && b.deliveryMode !== 'Asynchronous' && !asynchDaysList.includes(b.day))
      .reduce((acc, b) => {
        const [h1, m1] = b.startTime.split(':').map(Number);
        const [h2, m2] = b.endTime.split(':').map(Number);
        return acc + (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
      }, 0);

    const scheduledLecAsynch = subBlocks
      .filter(b => b.type === 'Lecture' && (b.deliveryMode === 'Asynchronous' || asynchDaysList.includes(b.day)))
      .reduce((acc, b) => {
        const [h1, m1] = b.startTime.split(':').map(Number);
        const [h2, m2] = b.endTime.split(':').map(Number);
        return acc + (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
      }, 0);

    const scheduledLec = scheduledLecF2F + scheduledLecAsynch;

    const scheduledLab = subBlocks
      .filter(b => b.type === 'Laboratory')
      .reduce((acc, b) => {
        const [h1, m1] = b.startTime.split(':').map(Number);
        const [h2, m2] = b.endTime.split(':').map(Number);
        return acc + (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
      }, 0);

    const isTwoHrLec = sub.lecHours === 2;
    const isComplete = isTwoHrLec
      ? (scheduledLecF2F >= 1 && scheduledLecAsynch >= 1 && scheduledLab >= sub.labHours)
      : (scheduledLec >= sub.lecHours && scheduledLab >= sub.labHours);

    return {
      subject: sub,
      blocks: subBlocks,
      scheduledLec,
      scheduledLecF2F,
      scheduledLecAsynch,
      scheduledLab,
      isTwoHrLec,
      isComplete
    };
  });

  const handleExportCSV = () => {
    if (!currentSection) return;
    const rows = sectionBlocks.map(b => {
      const sub = subjects.find(s => s.id === b.subjectId);
      const teacher = teachers.find(t => t.id === b.teacherId);
      const room = rooms.find(r => r.id === b.roomId);
      return {
        Day: b.day,
        StartTime: b.startTime,
        EndTime: b.endTime,
        SubjectCode: sub?.code || '',
        SubjectName: sub?.name || '',
        Type: b.type,
        Instructor: teacher?.name || '',
        Room: (b.deliveryMode === 'Asynchronous' || asynchDaysList.includes(b.day)) ? 'None (Asynchronous)' : (room?.name || '')
      };
    });
    exportToCSV(`section_schedule_${currentSection.code.replace(/\s+/g, '_')}.csv`, rows);
  };

  const [printScope, setPrintScope] = useState('current'); // 'current' | 'all'

  const handlePrint = (scope = 'current') => {
    setPrintScope(scope);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="space-y-6 font-poppins">
      {/* SCREEN INTERACTIVE CONTAINER (Hidden when printing) */}
      <div className="no-print space-y-6">
        {/* Header Banner */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-[#064e3b] text-amber-400 flex items-center justify-center font-bold">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-emerald-950">Section Official Class Schedule & Export</h1>
                <p className="text-xs text-slate-500 font-medium">
                  Official CBSUA class schedule layout with editable signatories & printable header (Landscape per Section)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Filter Year Level
                </label>
                <select
                  value={yearLevelFilter}
                  onChange={e => {
                    setYearLevelFilter(e.target.value);
                    const firstMatching = sections.find(s => e.target.value === 'ALL' || String(s.yearLevel) === String(e.target.value));
                    if (firstMatching) setSelectedSectionId(firstMatching.id);
                  }}
                  className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">🎓 All Year Levels</option>
                  <option value="1">1st Year Sections</option>
                  <option value="2">2nd Year Sections</option>
                  <option value="3">3rd Year Sections</option>
                  <option value="4">4th Year Sections</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Select Section ({filteredSections.length})
                </label>
                <select
                  value={selectedSectionId}
                  onChange={e => setSelectedSectionId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                >
                  {filteredSections.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.program} (Yr {s.yearLevel})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex items-center px-3.5 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-all"
                title="Edit 5 Signatories and Document Header Settings"
              >
                <Edit3 className="w-4 h-4 mr-1.5" />
                Edit Signatories
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all shadow-sm"
              >
                <Download className="w-4 h-4 mr-1.5 text-emerald-700" />
                Export CSV
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handlePrint('current')}
                  className="flex items-center px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md transition-all"
                  title="Print current section schedule on 1 landscape paper"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  Print ({currentSection?.code || 'Section'})
                </button>
                <button
                  onClick={() => handlePrint('all')}
                  className="flex items-center px-3 py-2 text-xs font-bold text-emerald-950 bg-amber-300 hover:bg-amber-400 rounded-xl shadow-md transition-all"
                  title="Print all sections, 1 landscape paper per section"
                >
                  <Printer className="w-4 h-4 mr-1" />
                  Print All ({filteredSections.length})
                </button>
              </div>
            </div>
          </div>

          {/* Display Mode Pill Tabs */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 inline-flex space-x-1">
              <button
                onClick={() => setViewMode('official')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'official'
                    ? 'bg-emerald-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-emerald-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                📜 Official Template (CBSUA Document)
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-emerald-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-emerald-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                📊 Interactive Timetable Grid
              </button>
            </div>

            <div className="text-xs text-slate-500 font-semibold hidden md:block">
              Signatories: <strong className="text-slate-900">{signatories.length || 5} Configured</strong>
            </div>
          </div>
        </div>

        {/* Subject Hour Fulfillment */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-extrabold text-emerald-950 mb-3 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-emerald-700" />
            Subject Hour Fulfillment for {currentSection?.code}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjectBreakdown.map(({ subject, scheduledLec, scheduledLecF2F, scheduledLecAsynch, scheduledLab, isTwoHrLec, isComplete }) => (
              <div
                key={subject.id}
                className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between space-y-2 ${
                  isComplete
                    ? 'bg-emerald-50/80 border-emerald-300 text-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-xs text-slate-900">{subject.code}</span>
                    <p className="text-slate-500 font-medium line-clamp-1">{subject.name}</p>
                  </div>
                  {isComplete && (
                    <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Complete
                    </span>
                  )}
                </div>

                {isTwoHrLec ? (
                  <div className="pt-2 border-t border-slate-200 text-[11px] font-semibold space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">
                        🏛️ F2F: <strong className={scheduledLecF2F >= 1 ? 'text-emerald-700' : 'text-amber-700'}>{scheduledLecF2F}/1h</strong>
                      </span>
                      <span className="text-slate-700">
                        ⚡ Asynch: <strong className={scheduledLecAsynch >= 1 ? 'text-amber-700' : 'text-amber-600'}>{scheduledLecAsynch}/1h</strong>
                      </span>
                    </div>
                    {subject.labHours > 0 && (
                      <div className="flex items-center justify-between pt-0.5 text-purple-900">
                        <span>🔬 Lab:</span>
                        <strong className={scheduledLab >= subject.labHours ? 'text-purple-700' : 'text-slate-500'}>{scheduledLab}/{subject.labHours}h</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 font-semibold">
                    <span>
                      Lec: <strong className="text-emerald-800">{scheduledLec}/{subject.lecHours}h</strong>
                    </span>
                    {subject.labHours > 0 ? (
                      <span>
                        Lab: <strong className="text-purple-800">{scheduledLab}/{subject.labHours}h</strong>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">No Lab</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* VIEW MODE RENDER ON SCREEN */}
        {viewMode === 'official' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-extrabold text-emerald-950 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-emerald-700" />
                Official CBSUA Class Schedule Layout ({currentSection?.code})
              </h2>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="text-xs text-emerald-800 font-bold hover:underline flex items-center"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Signatories / Names
              </button>
            </div>

            <OfficialClassScheduleDocument
              section={currentSection}
              blocks={blocks}
              subjects={subjects}
              teachers={teachers}
              rooms={rooms}
              signatories={signatories}
              templateSettings={templateSettings}
              selectedSemester={selectedSemester}
            />
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-emerald-950 flex items-center px-1">
              <Clock className="w-5 h-5 mr-2 text-emerald-700" />
              Interactive Class Timetable Grid for {currentSection?.code}
            </h2>
            <TimetableGrid
              blocks={blocks}
              subjects={subjects}
              teachers={teachers}
              rooms={rooms}
              sections={sections}
              conflicts={conflicts}
              asynchronousDays={templateSettings?.asynchronousDays || ['Wednesday']}
              viewMode="section"
              filterId={selectedSectionId}
            />
          </div>
        )}
      </div>

      {/* DEDICATED PRINT CONTAINER (Prints only when window.print() is called, 1 landscape paper per section) */}
      <div className="hidden print:block font-arial print-container">
        {printScope === 'all' ? (
          filteredSections.map(sec => (
            <div key={sec.id} className="official-print-page">
              <OfficialClassScheduleDocument
                section={sec}
                blocks={blocks}
                subjects={subjects}
                teachers={teachers}
                rooms={rooms}
                signatories={signatories}
                templateSettings={templateSettings}
                selectedSemester={selectedSemester}
              />
            </div>
          ))
        ) : (
          <div className="official-print-page">
            <OfficialClassScheduleDocument
              section={currentSection}
              blocks={blocks}
              subjects={subjects}
              teachers={teachers}
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
        onResetDefault={onResetSignatories}
      />
    </div>
  );
}
