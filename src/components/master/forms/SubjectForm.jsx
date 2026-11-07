import React from 'react';
import { AlertCircle } from 'lucide-react';
import MultiSelectDropdown from '../MultiSelectDropdown';

export default function SubjectForm({
  formData,
  onChange,
  rooms = [],
  programs = [],
  subjects = [],
  editingItem = null
}) {
  const lectureRooms = rooms.filter(
    r => !r.type || r.type === 'Lecture' || r.type === 'AVR' || r.type === 'Lecture & Laboratory' || r.type === 'Both'
  );
  const labRooms = rooms.filter(
    r => !r.type || r.type === 'Laboratory' || r.type === 'Lecture & Laboratory' || r.type === 'Both'
  );

  const cleanSubCode = (formData.code || '').trim().toLowerCase().replace(/\s+/g, '');
  const isDuplicateCode = cleanSubCode.length > 0 && subjects.some(s => {
    if (editingItem && s.id === editingItem.id) return false;
    return (s.code || '').trim().toLowerCase().replace(/\s+/g, '') === cleanSubCode;
  });

  const cleanSubName = (formData.name || '').trim().toLowerCase();
  const isDuplicateName = cleanSubName.length > 0 && subjects.some(s => {
    if (editingItem && s.id === editingItem.id) return false;
    return (s.name || '').trim().toLowerCase() === cleanSubName;
  });

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code</label>
          <input
            type="text"
            value={formData.code}
            onChange={e => onChange({ ...formData, code: e.target.value })}
            required
            placeholder="e.g. CC 101"
            className={`w-full border rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 font-bold ${
              isDuplicateCode
                ? 'bg-rose-50 border-rose-300 focus:ring-rose-500'
                : 'bg-slate-50 border-slate-300 focus:ring-emerald-600'
            }`}
          />
          {isDuplicateCode && (
            <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center">
              <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
              This Subject Code already exists!
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Units (1-12)</label>
          <input
            type="number"
            min="1"
            max="12"
            value={formData.units}
            onChange={e => onChange({ ...formData, units: Math.max(1, Number(e.target.value)) })}
            required
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Semester</label>
          <select
            value={formData.semester || '1st Semester'}
            onChange={e => onChange({ ...formData, semester: e.target.value })}
            required
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="1st Semester">📅 1st Semester</option>
            <option value="2nd Semester">📅 2nd Semester</option>
            <option value="Summer">☀️ Summer / Midyear</option>
            <option value="Both">🌐 Both Semesters</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Year Level Offered</label>
          <select
            value={formData.yearLevel || 1}
            onChange={e => onChange({ ...formData, yearLevel: Number(e.target.value) })}
            required
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value={1}>1st Year</option>
            <option value={2}>2nd Year</option>
            <option value={3}>3rd Year</option>
            <option value={4}>4th Year</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Title</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => onChange({ ...formData, name: e.target.value })}
          required
          placeholder="e.g. Computer Programming 1"
          className={`w-full border rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
            isDuplicateName
              ? 'bg-rose-50 border-rose-300 focus:ring-rose-500'
              : 'bg-slate-50 border-slate-300 focus:ring-emerald-600'
          }`}
        />
        {isDuplicateName && (
          <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center">
            <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
            A subject with this title already exists!
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Offering Program</label>
        {programs.length > 0 ? (
          <select
            value={formData.department}
            onChange={e => onChange({ ...formData, department: e.target.value })}
            required
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">-- Select Program --</option>
            {programs.map(p => (
              <option key={p.id} value={p.name}>
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
            placeholder="e.g. College of Computer Studies"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Lecture Hours/wk</label>
          <input
            type="number"
            min="0"
            value={formData.lecHours}
            onChange={e => {
              const lec = Number(e.target.value);
              const lab = Number(formData.labHours || 0);
              onChange({
                ...formData,
                lecHours: lec,
                totalHours: lec + lab
              });
            }}
            required
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Lab Hours/wk (0 if None)</label>
          <input
            type="number"
            min="0"
            value={formData.labHours}
            onChange={e => {
              const lab = Number(e.target.value);
              const lec = Number(formData.lecHours || 0);
              onChange({
                ...formData,
                labHours: lab,
                totalHours: lec + lab
              });
            }}
            required
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold"
          />
        </div>
      </div>

      <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
        <span>⏱️ Total Contact Hours:</span>
        <span className="text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg">
          {Number(formData.lecHours || 0) + Number(formData.labHours || 0)} Hours / Week
        </span>
      </div>

      {/* DESIGNATED SUITABLE ROOMS SELECTION (COMPACT MULTI-SELECT DROPDOWNS) */}
      <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-emerald-950 block">Designated Fit Rooms for this Subject:</span>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">Compact Multi-Select</span>
        </div>

        {formData.lecHours > 0 && (
          <MultiSelectDropdown
            label="Lecture Rooms Fit for this Subject"
            options={lectureRooms}
            selectedIds={formData.allowedLecRoomIds || []}
            placeholder="Select Lecture Rooms..."
            badgeColor="emerald"
            onChange={updatedIds => {
              onChange({
                ...formData,
                allowedLecRoomIds: updatedIds,
                defaultLecRoomId: updatedIds[0] || ''
              });
            }}
          />
        )}

        {formData.labHours > 0 ? (
          <MultiSelectDropdown
            label="Laboratory Rooms Fit for this Subject"
            options={labRooms}
            selectedIds={formData.allowedLabRoomIds || []}
            placeholder="Select Laboratory Rooms..."
            badgeColor="purple"
            onChange={updatedIds => {
              onChange({
                ...formData,
                allowedLabRoomIds: updatedIds,
                defaultLabRoomId: updatedIds[0] || ''
              });
            }}
          />
        ) : (
          <div className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200 font-medium">
            ℹ️ Lab Room Not Applicable (0 Lab Hours)
          </div>
        )}
      </div>
    </>
  );
}
