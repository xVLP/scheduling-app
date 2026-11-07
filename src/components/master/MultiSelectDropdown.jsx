import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function MultiSelectDropdown({
  label,
  options = [],
  selectedIds = [],
  onChange,
  placeholder = 'Select Rooms...',
  badgeColor = 'emerald'
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (id) => {
    const isSelected = selectedIds.includes(id);
    const updated = isSelected ? selectedIds.filter(item => item !== id) : [...selectedIds, id];
    onChange(updated);
  };

  const handleSelectAll = () => {
    onChange(options.map(o => o.id));
  };

  const handleClear = () => {
    onChange([]);
  };

  const selectedRooms = options.filter(o => selectedIds.includes(o.id));

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] text-slate-500 font-semibold">{selectedIds.length} of {options.length} selected</span>
      </label>

      {/* Control Button / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border rounded-xl px-3 py-2 text-left text-xs font-semibold flex items-center justify-between shadow-sm focus:outline-none transition-all ${
          isOpen 
            ? badgeColor === 'purple' ? 'border-purple-500 ring-2 ring-purple-100' : 'border-emerald-600 ring-2 ring-emerald-100'
            : 'border-slate-300 hover:border-slate-400 text-slate-800'
        }`}
      >
        <div className="truncate flex-1 mr-2">
          {selectedRooms.length === 0 ? (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          ) : (
            <span className="font-bold text-slate-900">
              ⭐ {selectedRooms.map(r => r.name).join(', ')}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1 shrink-0">
          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-md">
            {isOpen ? 'Close' : 'Choose'}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Inline Collapsible Checklist Panel */}
      {isOpen && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-md p-2.5 space-y-2 animate-in fade-in duration-100">
          {/* Action Bar */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[11px] px-1 font-bold">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-emerald-700 hover:text-emerald-900 hover:underline flex items-center"
            >
              ✓ Select All ({options.length})
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-rose-600 hover:text-rose-800 hover:underline"
            >
              ✕ Clear All
            </button>
          </div>

          {/* Scrollable Room List */}
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {options.map(r => {
              const isSelected = selectedIds.includes(r.id);
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => toggleOption(r.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                    isSelected
                      ? badgeColor === 'purple'
                        ? 'bg-purple-50 text-purple-950 font-bold border border-purple-200'
                        : 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200'
                      : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate mr-1">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected 
                        ? badgeColor === 'purple' ? 'bg-purple-700 border-purple-800 text-white' : 'bg-emerald-700 border-emerald-800 text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{r.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal shrink-0">({r.type || 'Room'})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
