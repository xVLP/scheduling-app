import React from 'react';
import { GraduationCap, Edit3, Trash2 } from 'lucide-react';

export default function ProgramsTab({
  programs = [],
  onEdit,
  onDelete
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {programs.length === 0 && (
        <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-2">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No programs registered yet</h3>
          <p className="text-xs text-slate-500">Click &ldquo;Add New PROGRAM&rdquo; above to register academic degree programs.</p>
        </div>
      )}

      {programs.map(prog => (
        <div
          key={prog.id}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-extrabold text-base text-[#064e3b]">{prog.code}</span>
                <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">{prog.name}</h3>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg shrink-0">
                Academic Program
              </span>
            </div>
            <div className="mt-4 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-700 font-medium">
              <span>Department / College:</span>{' '}
              <strong className="text-slate-900 font-bold ml-1">{prog.department || 'CBSUA College'}</strong>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-1 mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onEdit(prog)}
              className="p-2 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all"
              title="Edit Program"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(prog.id)}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              title="Delete Program"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
