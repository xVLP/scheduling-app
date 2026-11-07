import React from 'react';

export default function RoomForm({ formData, onChange }) {
  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Room Name / Code</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => onChange({ ...formData, name: e.target.value })}
          required
          placeholder="e.g. CLAB 301"
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Building Location (Optional)</label>
        <input
          type="text"
          value={formData.building}
          onChange={e => onChange({ ...formData, building: e.target.value })}
          placeholder="e.g. IT Building 3rd Floor"
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Room Designation Type</label>
          <select
            value={formData.type}
            onChange={e => onChange({ ...formData, type: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
          >
            <option value="Lecture & Laboratory">Lecture & Laboratory (Both / Multipurpose)</option>
            <option value="Lecture">Lecture Room Only</option>
            <option value="Laboratory">Laboratory Room Only</option>
            <option value="AVR">AVR / Hall</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity (Optional)</label>
          <input
            type="number"
            value={formData.capacity}
            onChange={e => onChange({ ...formData, capacity: e.target.value })}
            placeholder="e.g. 40"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>
    </>
  );
}
