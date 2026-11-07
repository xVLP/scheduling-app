import React from 'react';
import { AlertCircle } from 'lucide-react';
import MultiSelectDropdown from '../MultiSelectDropdown';

export default function TeacherForm({
  formData,
  onChange,
  programs = [],
  subjects = [],
  sections = [],
  teachers = [],
  scheduleBlocks = [],
  editingItem = null
}) {
  const cleanTeacherName = (formData.name || '').trim().toLowerCase();
  const isDuplicateTeacher = cleanTeacherName.length > 0 && teachers.some(t => {
    if (editingItem && t.id === editingItem.id) return false;
    return (t.name || '').trim().toLowerCase() === cleanTeacherName;
  });

  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Instructor Full Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => onChange({ ...formData, name: e.target.value })}
          required
          placeholder="e.g. Dr. Juan Dela Cruz"
          className={`w-full border rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 font-semibold ${
            isDuplicateTeacher
              ? 'bg-rose-50 border-rose-300 focus:ring-rose-500'
              : 'bg-slate-50 border-slate-300 focus:ring-emerald-600'
          }`}
        />
        {isDuplicateTeacher && (
          <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center">
            <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
            This instructor is already registered in the faculty list!
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Employment Status</label>
          <select
            value={formData.employmentType || 'Permanent'}
            onChange={e => onChange({ ...formData, employmentType: e.target.value })}
            required
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="Permanent">Permanent (Regular Faculty)</option>
            <option value="COS">COS (Contract of Service)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Program</label>
          {programs.length > 0 ? (
            <select
              value={formData.department}
              onChange={e => onChange({ ...formData, department: e.target.value })}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="">-- Select Program --</option>
              {programs.map(p => (
                <option key={p.id} value={p.department || p.name}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={formData.department}
              onChange={e => onChange({ ...formData, department: e.target.value })}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Max Units Limit</label>
          <input
            type="number"
            value={formData.maxUnits}
            onChange={e => onChange({ ...formData, maxUnits: e.target.value })}
            required
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Max Teaching Hours Limit</label>
          <input
            type="number"
            value={formData.maxHours}
            onChange={e => onChange({ ...formData, maxHours: e.target.value })}
            required
            placeholder="e.g. 20"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* ASSIGNED SUBJECTS MULTI-SELECT DROPDOWN */}
      <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-emerald-950 block">Assign Teaching Subjects for this Instructor:</span>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">Multi-Select</span>
        </div>

        <MultiSelectDropdown
          label="Select Subjects to Assign"
          options={subjects.map(s => ({
            id: s.id,
            name: `${s.code} - ${s.name} (${s.units} Units, ${s.totalHours || ((s.lecHours || 0) + (s.labHours || 0))}h)`,
            type: s.department || 'Subject'
          }))}
          selectedIds={formData.assignedSubjectIds || []}
          placeholder="Choose subjects for this instructor..."
          badgeColor="emerald"
          onChange={updatedIds => {
            // Keep pairs matching remaining selected subjects
            const currentPairs = formData.assignedSectionSubjectPairs || [];
            const filteredPairs = currentPairs.filter(p => updatedIds.includes(p.subjectId));

            onChange({
              ...formData,
              assignedSubjectIds: updatedIds,
              assignedSectionSubjectPairs: filteredPairs
            });
          }}
        />
      </div>

      {/* GRANULAR SECTION ASSIGNMENT PER SUBJECT */}
      {formData.assignedSubjectIds && formData.assignedSubjectIds.length > 0 && (
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900">
              Assign Specific Sections per Subject (Section Load Assignment):
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
              Per Section
            </span>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {formData.assignedSubjectIds.map(subId => {
              const sub = subjects.find(s => s.id === subId);
              if (!sub) return null;

              const currentPairs = formData.assignedSectionSubjectPairs || [];

              return (
                <div key={subId} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                    <span>📖 {sub.code} - {sub.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {sections.filter(sec => currentPairs.some(p => p.subjectId === sub.id && p.sectionId === sec.id)).length} sections assigned
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {sections.map(sec => {
                      const isAssignedToThisTeacher = currentPairs.some(
                        p => p.subjectId === sub.id && p.sectionId === sec.id
                      );

                      // Check if assigned to ANOTHER teacher in the teachers list
                      const otherTeacherWithPair = teachers.find(
                        t => t.id !== editingItem?.id &&
                        (t.assignedSectionSubjectPairs || []).some(p => p.subjectId === sub.id && p.sectionId === sec.id)
                      );

                      // Also check active schedule blocks for another teacher assigned to this subject & section
                      const blockOtherTeacherId = (scheduleBlocks || []).find(
                        b => b.subjectId === sub.id && b.sectionId === sec.id && b.teacherId && b.teacherId !== editingItem?.id
                      )?.teacherId;
                      const blockOtherTeacher = teachers.find(t => t.id === blockOtherTeacherId);

                      const takenByTeacher = otherTeacherWithPair || blockOtherTeacher;

                      const togglePair = () => {
                        if (takenByTeacher) return;
                        let updatedPairs;
                        if (isAssignedToThisTeacher) {
                          updatedPairs = currentPairs.filter(
                            p => !(p.subjectId === sub.id && p.sectionId === sec.id)
                          );
                        } else {
                          updatedPairs = [...currentPairs, { subjectId: sub.id, sectionId: sec.id }];
                        }
                        onChange({
                          ...formData,
                          assignedSectionSubjectPairs: updatedPairs
                        });
                      };

                      if (takenByTeacher) {
                        const teacherShortName = takenByTeacher.name.split(' ')[0] + ' ' + (takenByTeacher.name.split(' ').pop() || '');
                        return (
                          <button
                            type="button"
                            key={sec.id}
                            disabled={true}
                            title={`🚫 Section "${sec.code}" is already assigned to ${takenByTeacher.name} for ${sub.code}`}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-slate-100 text-slate-400 border-slate-200/80 cursor-not-allowed opacity-85 flex items-center space-x-1"
                          >
                            <span>🔒 {sec.code}</span>
                            <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300/80 px-1.5 py-0.2 rounded font-black ml-1">
                              Taken: {teacherShortName}
                            </span>
                          </button>
                        );
                      }

                      return (
                        <button
                          type="button"
                          key={sec.id}
                          onClick={togglePair}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                            isAssignedToThisTeacher
                              ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm hover:bg-emerald-900'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isAssignedToThisTeacher ? '✓ ' : '+ '}{sec.code}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
