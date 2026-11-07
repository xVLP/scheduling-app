import React, { useState } from 'react';
import { Users, Search, X, Edit3, Trash2, Sparkles, CheckCircle2, Plus } from 'lucide-react';

const MATRIX_YEARS = [1, 2, 3, 4];
const MATRIX_LETTERS = ['A', 'B', 'C', 'D'];

export default function SectionsTab({
  sections = [],
  programs = [],
  onEdit,
  onDelete,
  onQuickAdd
}) {
  const [sectionSearchQuery, setSectionSearchQuery] = useState('');
  const [sectionYearFilter, setSectionYearFilter] = useState('ALL'); // 'ALL' | '1' | '2' | '3' | '4'
  const [sectionProgramFilter, setSectionProgramFilter] = useState('ALL');
  const [selectedQuickProgram, setSelectedQuickProgram] = useState(programs[0]?.name || '');

  const uniqueSectionPrograms = Array.from(new Set(sections.map(s => s.program).filter(Boolean)));

  const filteredMasterSections = sections.filter(sec => {
    const query = sectionSearchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      sec.code.toLowerCase().includes(query) || 
      (sec.program && sec.program.toLowerCase().includes(query));

    const matchesYear = sectionYearFilter === 'ALL' || String(sec.yearLevel) === String(sectionYearFilter);
    const matchesProg = sectionProgramFilter === 'ALL' || sec.program === sectionProgramFilter;

    return matchesQuery && matchesYear && matchesProg;
  });

  const handleResetFilters = () => {
    setSectionSearchQuery('');
    setSectionYearFilter('ALL');
    setSectionProgramFilter('ALL');
  };

  // Helper to check if a section exists by code (normalized)
  const findExistingSection = (yr, letter) => {
    const testCompact = `${yr}${letter}`.toLowerCase();
    return sections.find(sec => {
      const clean = (sec.code || '').toLowerCase().replace(/[-\s]/g, '');
      return clean === testCompact || clean.endsWith(testCompact);
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. QUICK SECTION GENERATOR MATRIX (NO TYPING REQUIRED) */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-slate-900 border border-emerald-800/80 rounded-2xl p-5 text-white shadow-xl space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/60">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-extrabold text-white">
                Quick Section Generator (1-Click Creation)
              </h2>
            </div>
            <p className="text-xs text-emerald-200/80 font-medium mt-0.5">
              No manual typing required! Simply click a section code (e.g., <strong>2A</strong>) to instantly generate it with zero duplicates.
            </p>
          </div>

          {programs.length > 0 && (
            <div className="flex items-center space-x-2 shrink-0">
              <label className="text-[11px] font-bold text-emerald-300">Target Program:</label>
              <select
                value={selectedQuickProgram || programs[0]?.name}
                onChange={e => setSelectedQuickProgram(e.target.value)}
                className="bg-emerald-800/90 border border-emerald-700 text-white rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                {programs.map(p => (
                  <option key={p.id} value={p.name} className="bg-slate-900 text-white">
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 4-Row Matrix: Year 1 to 4 with Letters A, B, C, D */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MATRIX_YEARS.map(yr => (
            <div
              key={yr}
              className="bg-emerald-800/30 border border-emerald-700/50 rounded-xl p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-300 tracking-wider">
                  {yr === 1 ? '1st Year' : yr === 2 ? '2nd Year' : yr === 3 ? '3rd Year' : '4th Year'}
                </span>
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-900/60 px-1.5 py-0.5 rounded">
                  Level {yr}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {MATRIX_LETTERS.map(letter => {
                  const existingSec = findExistingSection(yr, letter);
                  const isCreated = !!existingSec;

                  if (isCreated) {
                    return (
                      <div
                        key={letter}
                        className="py-1.5 px-2 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-200 text-xs font-bold flex items-center justify-between"
                        title={`Section ${existingSec.code} is already created`}
                      >
                        <span className="font-black font-mono">{existingSec.code}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                    );
                  }

                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => onQuickAdd && onQuickAdd(yr, letter, selectedQuickProgram || programs[0]?.name)}
                      className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-between border border-emerald-400/40 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer group"
                      title={`Click to quickly create Section ${yr}${letter}`}
                    >
                      <span className="font-black font-mono">{yr}{letter}</span>
                      <Plus className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-90 transition-transform" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. SECTIONS FILTER BAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sectionSearchQuery}
              onChange={e => setSectionSearchQuery(e.target.value)}
              placeholder="Search sections by code (e.g. 2A) or program..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {sectionSearchQuery && (
              <button
                onClick={() => setSectionSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns for Year Level & Program */}
          <div className="flex items-center space-x-2">
            <select
              value={sectionYearFilter}
              onChange={e => setSectionYearFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-extrabold focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value="ALL">🎓 All Year Levels</option>
              <option value="1">1st Year Sections</option>
              <option value="2">2nd Year Sections</option>
              <option value="3">3rd Year Sections</option>
              <option value="4">4th Year Sections</option>
            </select>

            {uniqueSectionPrograms.length > 0 && (
              <select
                value={sectionProgramFilter}
                onChange={e => setSectionProgramFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
              >
                <option value="ALL">📚 All Programs ({uniqueSectionPrograms.length})</option>
                {uniqueSectionPrograms.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* 3. SECTIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMasterSections.length === 0 && (
          <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No sections match the selected filter</h3>
            <p className="text-xs text-slate-500">Try adjusting the year level or program filter.</p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer"
            >
              Reset Section Filters
            </button>
          </div>
        )}

        {filteredMasterSections.map(sec => (
          <div
            key={sec.id}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all group"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-lg text-slate-900 font-mono tracking-tight">{sec.code}</h3>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md">
                      Year {sec.yearLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1">{sec.program}</p>
                </div>
              </div>

              <div className="mt-4 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-700 font-medium flex items-center justify-between">
                <span>Class Enrolment:</span>
                <strong className="text-emerald-950 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                  {sec.studentCount} Students
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-1 mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => onEdit(sec)}
                className="p-2 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                title="Edit Section"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(sec.id)}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                title="Delete Section"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
