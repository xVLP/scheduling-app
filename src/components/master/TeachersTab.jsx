import React, { useState } from 'react';
import { UserCheck, Search, X, Edit3, Trash2 } from 'lucide-react';

export default function TeachersTab({
  teachers = [],
  subjects = [],
  sections = [],
  scheduleBlocks = [],
  onEdit,
  onDelete
}) {
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [teacherEmploymentFilter, setTeacherEmploymentFilter] = useState('ALL'); // 'ALL' | 'Permanent' | 'COS'
  const [teacherDeptFilter, setTeacherDeptFilter] = useState('ALL');

  const uniqueTeacherDepts = Array.from(new Set(teachers.map(t => t.department).filter(Boolean)));

  const filteredMasterTeachers = teachers.filter(t => {
    const query = teacherSearchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      t.name.toLowerCase().includes(query) || 
      (t.department && t.department.toLowerCase().includes(query));

    const matchesEmployment = teacherEmploymentFilter === 'ALL' || t.employmentType === teacherEmploymentFilter;
    const matchesDept = teacherDeptFilter === 'ALL' || t.department === teacherDeptFilter;

    return matchesQuery && matchesEmployment && matchesDept;
  });

  const handleResetFilters = () => {
    setTeacherSearchQuery('');
    setTeacherEmploymentFilter('ALL');
    setTeacherDeptFilter('ALL');
  };

  return (
    <div className="space-y-6">
      {/* TEACHERS / INSTRUCTORS FILTER BAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={teacherSearchQuery}
              onChange={e => setTeacherSearchQuery(e.target.value)}
              placeholder="Search instructors by name or department..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {teacherSearchQuery && (
              <button
                onClick={() => setTeacherSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Employment Status Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <select
              value={teacherEmploymentFilter}
              onChange={e => setTeacherEmploymentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-extrabold focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value="ALL">👔 All Employment Types ({teachers.length})</option>
              <option value="Permanent">🏛️ Permanent (Regular)</option>
              <option value="COS">📋 COS (Contract of Service)</option>
            </select>

            {uniqueTeacherDepts.length > 0 && (
              <select
                value={teacherDeptFilter}
                onChange={e => setTeacherDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
              >
                <option value="ALL">🎓 All Departments ({uniqueTeacherDepts.length})</option>
                {uniqueTeacherDepts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* TEACHERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMasterTeachers.length === 0 && (
          <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-2">
            <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No instructors match your filter criteria</h3>
            <p className="text-xs text-slate-500">Try changing the employment type filter or search term.</p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all"
            >
              Reset Instructor Filters
            </button>
          </div>
        )}

        {filteredMasterTeachers.map(prof => {
          const profBlocks = scheduleBlocks.filter(b => b.teacherId === prof.id);
          const scheduledSubIds = Array.from(new Set(profBlocks.map(b => b.subjectId)));
          const assignedSubList = subjects.filter(
            s => (prof.assignedSubjectIds || []).includes(s.id) || scheduledSubIds.includes(s.id)
          );

          let assignedUnits = 0;
          let assignedLoadHours = 0;

          if (prof.assignedSectionSubjectPairs && prof.assignedSectionSubjectPairs.length > 0) {
            prof.assignedSectionSubjectPairs.forEach(pair => {
              const sub = subjects.find(s => s.id === pair.subjectId);
              if (sub) {
                assignedUnits += Number(sub.units || 0);
                assignedLoadHours += Number(sub.totalHours || ((sub.lecHours || 0) + (sub.labHours || 0)) || 0);
              }
            });
          } else {
            assignedUnits = assignedSubList.reduce((sum, s) => sum + (s.units || 0), 0);
            assignedLoadHours = assignedSubList.reduce(
              (sum, s) => sum + (s.totalHours || ((s.lecHours || 0) + (s.labHours || 0)) || 0),
              0
            );
          }

          const displayHours = Math.round(assignedLoadHours * 10) / 10;
          const maxHrs = prof.maxHours || 30;
          const maxUnits = prof.maxUnits || 24;
          const isOverloaded = displayHours > maxHrs;

          return (
            <div
              key={prof.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{prof.name}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{prof.department}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider shrink-0 ${
                      prof.employmentType === 'COS'
                        ? 'bg-amber-100 text-amber-950 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                    }`}
                  >
                    {prof.employmentType === 'COS' ? '📋 COS' : '🏛️ Permanent'}
                  </span>
                </div>

                <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-2 text-xs font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-semibold">🎓 Total Units Assigned:</span>
                    <strong className="text-emerald-950 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200">
                      {assignedUnits} / {maxUnits} Units
                    </strong>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-600 font-semibold">⏰ Total Weekly Hours:</span>
                    <strong
                      className={`font-extrabold px-2 py-0.5 rounded-lg border ${
                        isOverloaded
                          ? 'bg-rose-100 text-rose-950 border-rose-300'
                          : 'bg-purple-100 text-purple-950 border-purple-200'
                      }`}
                    >
                      {displayHours} / {maxHrs} Hours/wk
                      {isOverloaded && <span className="ml-1 text-[10px] text-rose-700 font-black">⚠️ Exceeded</span>}
                    </strong>
                  </div>

                  {/* Assigned Subjects Badges & Detailed Time Breakdown */}
                  <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>📚 Assigned Subjects & Sections ({assignedSubList.length}):</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Breakdown:</span>
                    </div>
                    {assignedSubList.length > 0 ? (
                      <div className="space-y-1.5">
                        {assignedSubList.map(s => {
                          const sectionPairs = (prof.assignedSectionSubjectPairs || []).filter(p => p.subjectId === s.id);
                          const assignedSecCodes = sectionPairs
                            .map(p => sections.find(sec => sec.id === p.sectionId)?.code)
                            .filter(Boolean);
                          const subContactHours = Number(s.totalHours || ((s.lecHours || 0) + (s.labHours || 0)) || 0);
                          const totalSubHours = (assignedSecCodes.length > 0 ? assignedSecCodes.length : 1) * subContactHours;

                          return (
                            <div key={s.id} className="bg-white p-2 rounded-xl border border-slate-200 text-[10px] space-y-1 shadow-2xs">
                              <div className="flex items-center justify-between font-bold text-emerald-950">
                                <span>
                                  {s.code} ({s.units}u) — <span className="text-purple-800 font-black">{subContactHours}h/sec</span>
                                </span>
                                <span className="text-[9px] text-slate-500 font-semibold truncate max-w-[130px]">{s.name}</span>
                              </div>
                              {assignedSecCodes.length > 0 ? (
                                <div className="flex items-center justify-between pt-0.5">
                                  <div className="flex flex-wrap gap-1">
                                    {assignedSecCodes.map(code => (
                                      <span
                                        key={code}
                                        className="bg-emerald-100 text-emerald-900 font-extrabold px-1.5 py-0.2 text-[9px] rounded-md border border-emerald-300"
                                      >
                                        ✓ {code}
                                      </span>
                                    ))}
                                  </div>
                                  <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[9px] border border-slate-200 shrink-0 ml-1">
                                    Subtotal: {totalSubHours} hrs
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[9px] text-slate-400 italic block">All Sections (General) — {subContactHours} hrs</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic block">No subjects assigned yet</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-1 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onEdit(prof)}
                  className="p-2 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all"
                  title="Edit Instructor"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(prof.id)}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  title="Delete Instructor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
