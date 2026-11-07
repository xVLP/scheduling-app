import React from 'react';

export default function ProgramForm({ formData, onChange }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Program Code</label>
          <input
            type="text"
            value={formData.code}
            onChange={e => onChange({ ...formData, code: e.target.value })}
            required
            placeholder="e.g. BSCS"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Department / College</label>
          <input
            type="text"
            value={formData.department}
            onChange={e => onChange({ ...formData, department: e.target.value })}
            required
            placeholder="e.g. College of Computer Studies"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Program Full Title</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => onChange({ ...formData, name: e.target.value })}
          required
          placeholder="e.g. BS Computer Science"
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>
    </>
  );
}
