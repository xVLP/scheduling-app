import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Shield, CheckCircle2, RotateCcw, Zap, AlertCircle } from 'lucide-react';

export default function TemplateSettingsModal({
  isOpen,
  onClose,
  signatories = [],
  templateSettings = {},
  onSaveSignatories,
  onSaveTemplateSettings,
  onResetDefault
}) {
  const [localSignatories, setLocalSignatories] = useState([]);
  const [localSettings, setLocalSettings] = useState({});
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    setLocalSignatories(signatories || []);
    setLocalSettings(templateSettings || {});
  }, [signatories, templateSettings, isOpen]);

  if (!isOpen) return null;

  const handleSignatoryChange = (index, field, value) => {
    const updated = [...localSignatories];
    updated[index] = { ...updated[index], [field]: value };
    setLocalSignatories(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSignatories(localSignatories);
    onSaveTemplateSettings(localSettings);
    setToastMessage('Signatories, Template & Asynchronous Days settings saved!');
    setTimeout(() => {
      setToastMessage('');
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    if (confirm('Reset signatories and document template settings back to CBSUA defaults?')) {
      onResetDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-hidden font-poppins no-print">
      <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#064e3b] text-amber-400 flex items-center justify-center font-bold shadow-inner">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Official Template & Academic Modality Settings
              </h2>
              <p className="text-xs text-slate-500 font-medium">Asynchronous Days Policy, Signatory Names, College Header & Form Codes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {toastMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center space-x-2 font-bold animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="my-3 space-y-5 overflow-y-auto pr-2 flex-1 max-h-[68vh]">
          {/* Section 1: Asynchronous Days Configuration (Strict Lab Prohibition) */}
          <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-300/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-950 flex items-center">
                <Zap className="w-4 h-4 mr-1.5 text-amber-600" />
                Asynchronous Online Learning Days (Laboratory Prohibited)
              </h3>
              <span className="text-[11px] font-black text-amber-950 bg-amber-300/80 px-2 py-0.5 rounded-full border border-amber-400">
                {(localSettings.asynchronousDays || []).length} Active Day{(localSettings.asynchronousDays || []).length !== 1 ? 's' : ''}
              </span>
            </div>

            <p className="text-xs text-slate-700 font-medium">
              Select which days are designated as <strong>Asynchronous</strong>. When a day is set as Asynchronous, the system will <strong>strictly prohibit</strong> and block scheduling face-to-face Laboratory sessions on that day.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(dayName => {
                const isSelected = (localSettings.asynchronousDays || []).includes(dayName);
                return (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => {
                      const currentDays = localSettings.asynchronousDays || [];
                      const nextDays = isSelected
                        ? currentDays.filter(d => d !== dayName)
                        : [...currentDays, dayName];
                      setLocalSettings({ ...localSettings, asynchronousDays: nextDays });
                    }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-amber-400 text-emerald-950 border-amber-500 shadow-sm ring-2 ring-amber-400/50'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50/60'
                    }`}
                  >
                    <span>{dayName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black uppercase ${
                      isSelected ? 'bg-emerald-950 text-amber-300' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isSelected ? 'ASYNCH (NO LAB)' : 'REGULAR'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-amber-900 bg-amber-100/70 p-2 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                Active Asynchronous Days: <strong>{(localSettings.asynchronousDays || []).join(', ') || 'None configured (All Regular Days)'}</strong>
              </span>
            </div>
          </div>

          {/* Section 2: Template Header Settings */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center">
              <Shield className="w-4 h-4 mr-1.5 text-emerald-700" />
              Document Header & Form Metadata
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">College / Department Title</label>
                <input
                  type="text"
                  value={localSettings.collegeName || ''}
                  onChange={e => setLocalSettings({ ...localSettings, collegeName: e.target.value })}
                  placeholder="e.g. COLLEGE OF INFORMATION TECHNOLOGY"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic School Year</label>
                <input
                  type="text"
                  value={localSettings.schoolYear || ''}
                  onChange={e => setLocalSettings({ ...localSettings, schoolYear: e.target.value })}
                  placeholder="e.g. SY 2024 – 2025"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Form Code (Footer)</label>
                <input
                  type="text"
                  value={localSettings.documentCode || ''}
                  onChange={e => setLocalSettings({ ...localSettings, documentCode: e.target.value })}
                  placeholder="e.g. CIT-FR-001"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Effectivity Date</label>
                  <input
                    type="text"
                    value={localSettings.effectivityDate || ''}
                    onChange={e => setLocalSettings({ ...localSettings, effectivityDate: e.target.value })}
                    placeholder="e.g. June 3, 2024"
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Revision No.</label>
                  <input
                    type="text"
                    value={localSettings.revisionNo || ''}
                    onChange={e => setLocalSettings({ ...localSettings, revisionNo: e.target.value })}
                    placeholder="e.g. 2"
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Editable 5 Signatories */}
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950">
              ✍️ Signatories (5 Official Document Signatures)
            </h3>

            <div className="space-y-3">
              {localSignatories.map((sig, idx) => (
                <div key={sig.id || idx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                  <div className="text-[11px] font-extrabold text-emerald-900">
                    Signatory {idx + 1}: <span className="text-slate-600 font-semibold">{sig.label}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Label / Role</label>
                      <input
                        type="text"
                        value={sig.label || ''}
                        onChange={e => handleSignatoryChange(idx, 'label', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                      <input
                        type="text"
                        value={sig.name || ''}
                        onChange={e => handleSignatoryChange(idx, 'name', e.target.value)}
                        placeholder="e.g. VERONICA LOUISE L. PIANDO"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Official Title / Position</label>
                      <input
                        type="text"
                        value={sig.title || ''}
                        onChange={e => handleSignatoryChange(idx, 'title', e.target.value)}
                        placeholder="e.g. Program Chairperson"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all flex items-center"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset Defaults
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-extrabold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-all flex items-center"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Save Signatories & Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
