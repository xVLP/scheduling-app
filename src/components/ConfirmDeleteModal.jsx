import React from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  itemName = "",
  itemType = "item",
  affectedBlocksCount = 0,
  details = ""
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-hidden no-print font-poppins">
      <div className="bg-white border border-rose-200 text-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-rose-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
              <p className="text-xs text-rose-700 font-semibold">Caution: Deletion is permanent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="my-4 space-y-3">
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            Are you sure you want to delete this {itemType}?
          </p>

          <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl font-bold text-xs text-rose-950">
            <span>{itemName}</span>
          </div>

          {affectedBlocksCount > 0 ? (
            <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl text-xs text-amber-950 space-y-1">
              <div className="flex items-center space-x-1.5 font-extrabold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Impact on Schedule (Automatic Vacation):</span>
              </div>
              <p className="text-[11px] text-amber-900 font-medium">
                Deleting this {itemType} will automatically remove <strong className="font-extrabold">{affectedBlocksCount} scheduled class session(s)</strong> and vacate their timetable slots in the Dean Workstation.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[11px] text-slate-600 font-medium">
              ℹ️ No active timetable sessions currently use this {itemType}.
            </div>
          )}

          {details && (
            <p className="text-[11px] text-slate-500 italic">{details}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Yes, Delete & Vacate Slots</span>
          </button>
        </div>

      </div>
    </div>
  );
}
