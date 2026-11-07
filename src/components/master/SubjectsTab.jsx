import React, { useState } from 'react';
import { BookOpen, Search, X, Edit3, Trash2, RotateCcw, MapPin } from 'lucide-react';

export default function SubjectsTab({ subjects = [], rooms = [], onEdit, onDelete }) {
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');
  const [subjectTypeFilter, setSubjectTypeFilter] = useState('ALL'); // 'ALL' | 'LEC_ONLY' | 'LAB_COMBINED' | 'LAB_ONLY'
  const [subjectDeptFilter, setSubjectDeptFilter] = useState('ALL');
  const [subjectSemFilter, setSubjectSemFilter] = useState('ALL');
  const [subjectYearFilter, setSubjectYearFilter] = useState('ALL');

  const uniqueSubjectDepts = Array.from(new Set(subjects.map(s => s.department).filter(Boolean)));

  const getRoomName = (id) => rooms.find(r => r.id === id)?.name || 'Optional / Unassigned';

  const filteredMasterSubjects = subjects.filter(sub => {
    const query = subjectSearchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      sub.code.toLowerCase().includes(query) || 
      sub.name.toLowerCase().includes(query) || 
      (sub.department && sub.department.toLowerCase().includes(query));

    let matchesType = true;
    const hasLec = (sub.lecHours || 0) > 0;
    const hasLab = (sub.labHours || 0) > 0;

    if (subjectTypeFilter === 'LEC_ONLY') {
      matchesType = hasLec && !hasLab;
    } else if (subjectTypeFilter === 'LAB_COMBINED') {
      matchesType = hasLec && hasLab;
    } else if (subjectTypeFilter === 'LAB_ONLY') {
      matchesType = hasLab && !hasLec;
    }

    const matchesDept = subjectDeptFilter === 'ALL' || sub.department === subjectDeptFilter;
    const matchesSem = subjectSemFilter === 'ALL' || sub.semester === subjectSemFilter || sub.semester === 'Both';
    const matchesYear = subjectYearFilter === 'ALL' || String(sub.yearLevel) === String(subjectYearFilter);

    return matchesQuery && matchesType && matchesDept && matchesSem && matchesYear;
  });

  const handleResetFilters = () => {
    setSubjectSearchQuery('');
    setSubjectTypeFilter('ALL');
    setSubjectDeptFilter('ALL');
    setSubjectSemFilter('ALL');
    setSubjectYearFilter('ALL');
  };

  const isFiltering = subjectSearchQuery || 
    subjectTypeFilter !== 'ALL' || 
    subjectDeptFilter !== 'ALL' || 
    subjectSemFilter !== 'ALL' || 
    subjectYearFilter !== 'ALL';

  return (
    <div className="space-y-6">
      {/* SUBJECTS FILTER BAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={subjectSearchQuery}
              onChange={e => setSubjectSearchQuery(e.target.value)}
              placeholder="Search subjects by code, title, or program/department..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {subjectSearchQuery && (
              <button
                onClick={() => setSubjectSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department / Program Filter */}
          {uniqueSubjectDepts.length > 0 && (
            <div className="shrink-0">
              <select
                value={subjectDeptFilter}
                onChange={e => setSubjectDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
              >
                <option value="ALL">🎓 All Programs ({uniqueSubjectDepts.length})</option>
                {uniqueSubjectDepts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Component Filter Dropdowns (Semester, Year Level, Subject Type) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2 font-bold">
            {/* Semester Dropdown */}
            <div className="flex items-center space-x-1">
              <span className="text-[11px] text-slate-500 font-semibold">Semester:</span>
              <select
                value={subjectSemFilter}
                onChange={e => setSubjectSemFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Semesters</option>
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
            </div>

            {/* Year Level Dropdown */}
            <div className="flex items-center space-x-1">
              <span className="text-[11px] text-slate-500 font-semibold">Year Level:</span>
              <select
                value={subjectYearFilter}
                onChange={e => setSubjectYearFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            {/* Subject Type Dropdown */}
            <div className="flex items-center space-x-1">
              <span className="text-[11px] text-slate-500 font-semibold">Subject Type:</span>
              <select
                value={subjectTypeFilter}
                onChange={e => setSubjectTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Types ({subjects.length})</option>
                <option value="LEC_ONLY">📚 Lecture Only</option>
                <option value="LAB_COMBINED">🧪 Lab & Lecture (Combined)</option>
                <option value="LAB_ONLY">🔬 Laboratory Only</option>
              </select>
            </div>
          </div>

          {/* Summary & Reset */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">
              Showing <strong className="text-slate-900 font-bold">{filteredMasterSubjects.length}</strong> of {subjects.length} subjects
            </span>

            {isFiltering && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all flex items-center"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUBJECTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMasterSubjects.length === 0 && (
          <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No subjects match your filter criteria</h3>
            <p className="text-xs text-slate-500">Try adjusting your search keyword or switching the Lecture/Lab filter pill.</p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all"
            >
              Clear Subject Filters
            </button>
          </div>
        )}

        {filteredMasterSubjects.map(sub => (
          <div
            key={sub.id}
            style={{ borderLeftColor: sub.color || '#059669' }}
            className="bg-white border border-slate-200/80 border-l-4 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-extrabold text-base text-slate-900">{sub.code}</span>
                  <h3 className="text-xs text-slate-600 font-medium line-clamp-1 mt-0.5">{sub.name}</h3>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg">
                    {sub.units} Units
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${
                    sub.lecHours > 0 && sub.labHours > 0 
                      ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                      : sub.labHours > 0 
                      ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  }`}>
                    {sub.lecHours > 0 && sub.labHours > 0 ? 'Lec & Lab' : sub.labHours > 0 ? 'Lab Only' : 'Lecture Only'}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-2 font-medium">
                <div className="flex items-center justify-between text-slate-700">
                  <span>Total Hours:</span>
                  <strong className="text-emerald-900 font-bold">{sub.totalHours} hrs/wk</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1.5 border-t border-slate-200/60">
                  <span>Lecture: <strong className="text-emerald-800 font-bold">{sub.lecHours || 0}h</strong></span>
                  <span>Lab: <strong className="text-purple-800 font-bold">{sub.labHours || 0}h</strong></span>
                </div>

                {/* Designated Fit Rooms */}
                <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-[11px]">
                  {sub.lecHours > 0 ? (
                    <div className="text-slate-700">
                      <div className="flex items-center justify-between font-bold text-emerald-950 mb-0.5">
                        <span className="flex items-center"><MapPin className="w-3.5 h-3.5 text-emerald-700 mr-1" /> Fit Lec Rooms:</span>
                        <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full font-bold">
                          {sub.allowedLecRoomIds?.length || (sub.defaultLecRoomId ? 1 : 0)} rooms
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600 font-semibold truncate bg-white px-2 py-1 rounded-md border border-slate-200">
                        {sub.allowedLecRoomIds?.length > 0
                          ? sub.allowedLecRoomIds.map(id => getRoomName(id)).join(', ')
                          : getRoomName(sub.defaultLecRoomId)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-[10px]">Lecture: N/A</div>
                  )}

                  {sub.labHours > 0 ? (
                    <div className="text-slate-700">
                      <div className="flex items-center justify-between font-bold text-purple-950 mb-0.5">
                        <span className="flex items-center"><MapPin className="w-3.5 h-3.5 text-purple-700 mr-1" /> Fit Lab Rooms:</span>
                        <span className="text-[10px] text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded-full font-bold">
                          {sub.allowedLabRoomIds?.length || (sub.defaultLabRoomId ? 1 : 0)} rooms
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600 font-semibold truncate bg-white px-2 py-1 rounded-md border border-slate-200">
                        {sub.allowedLabRoomIds?.length > 0
                          ? sub.allowedLabRoomIds.map(id => getRoomName(id)).join(', ')
                          : getRoomName(sub.defaultLabRoomId)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-[10px]">Lab: N/A (Lecture Only)</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-1 mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => onEdit(sub)}
                className="p-2 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all"
                title="Edit Subject"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(sub.id)}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                title="Delete Subject"
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
