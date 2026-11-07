import React, { useState, useEffect } from 'react';
import { Users, Sparkles, AlertCircle, CheckCircle2, Sliders } from 'lucide-react';

const COMMON_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const COMMON_STUDENT_COUNTS = [30, 35, 40, 45, 50];

export default function SectionForm({
  formData,
  onChange,
  programs = [],
  sections = [],
  editingItem = null
}) {
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [formatStyle, setFormatStyle] = useState('compact'); // 'compact' (2A) | 'program' (BSIT 2A) | 'dashed' (2-A) | 'custom'
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Determine current program code
  const currentProgramObj = programs.find(p => p.name === formData.program) || programs[0];
  const programCode = currentProgramObj?.code || 'BSIT';

  // Extract initial letter and format on mount or when editingItem changes
  useEffect(() => {
    if (formData.code) {
      const match = formData.code.match(/([A-Z])$/i);
      if (match) {
        setSelectedLetter(match[1].toUpperCase());
      }
      // Check if it matches compact (e.g. 2A)
      if (/^[1-4][A-Z]$/i.test(formData.code.trim())) {
        setFormatStyle('compact');
        setIsCustomMode(false);
      } else if (/^[1-4]-[A-Z]$/i.test(formData.code.trim())) {
        setFormatStyle('dashed');
        setIsCustomMode(false);
      } else if (new RegExp(`^${programCode}\\s+[1-4][A-Z]$`, 'i').test(formData.code.trim())) {
        setFormatStyle('program');
        setIsCustomMode(false);
      } else if (editingItem) {
        setIsCustomMode(true);
      }
    }
  }, [editingItem]);

  // Compute generated code based on year, letter, and format style
  const generateCode = (year, letter, style, progCode) => {
    const yr = year || 1;
    const ltr = letter || 'A';
    if (style === 'compact') return `${yr}${ltr}`;
    if (style === 'dashed') return `${yr}-${ltr}`;
    if (style === 'program') return `${progCode} ${yr}${ltr}`;
    return `${yr}${ltr}`;
  };

  const handleYearChange = (year) => {
    const yr = Number(year);
    if (!isCustomMode) {
      const newCode = generateCode(yr, selectedLetter, formatStyle, programCode);
      onChange({ ...formData, yearLevel: yr, code: newCode });
    } else {
      onChange({ ...formData, yearLevel: yr });
    }
  };

  const handleLetterChange = (letter) => {
    setSelectedLetter(letter);
    if (!isCustomMode) {
      const newCode = generateCode(formData.yearLevel || 1, letter, formatStyle, programCode);
      onChange({ ...formData, code: newCode });
    }
  };

  const handleFormatStyleChange = (style) => {
    setFormatStyle(style);
    if (style === 'custom') {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
      const newCode = generateCode(formData.yearLevel || 1, selectedLetter, style, programCode);
      onChange({ ...formData, code: newCode });
    }
  };

  // Check if a section code candidate already exists (normalized)
  const checkDuplicate = (testCode) => {
    if (!testCode) return false;
    const cleanTest = testCode.trim().toLowerCase().replace(/[-\s]/g, '');
    return sections.some(sec => {
      if (editingItem && sec.id === editingItem.id) return false;
      const cleanExisting = (sec.code || '').trim().toLowerCase().replace(/[-\s]/g, '');
      return cleanExisting === cleanTest;
    });
  };

  const isCurrentDuplicate = checkDuplicate(formData.code);

  return (
    <div className="space-y-4">
      {/* 1. ACADEMIC PROGRAM */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Academic Program (Course / Department)
        </label>
        {programs.length > 0 ? (
          <select
            value={formData.program}
            onChange={e => {
              const newProgName = e.target.value;
              const newProg = programs.find(p => p.name === newProgName);
              const newProgCode = newProg?.code || programCode;
              let updatedCode = formData.code;
              if (!isCustomMode && formatStyle === 'program') {
                updatedCode = generateCode(formData.yearLevel || 1, selectedLetter, 'program', newProgCode);
              }
              onChange({ ...formData, program: newProgName, code: updatedCode });
            }}
            required
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
          >
            {programs.map(p => (
              <option key={p.id} value={p.name}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={formData.program}
            onChange={e => onChange({ ...formData, program: e.target.value })}
            required
            placeholder="e.g. BS Information Technology"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        )}
      </div>

      {/* 2. SECTION PICKER (INSTEAD OF TYPING) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-950">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Interactive Section Builder (Select Mode)</span>
          </div>
          <button
            type="button"
            onClick={() => handleFormatStyleChange(isCustomMode ? 'compact' : 'custom')}
            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 underline cursor-pointer"
          >
            <Sliders className="w-3 h-3" />
            <span>{isCustomMode ? 'Use Button Picker' : 'Type Manually'}</span>
          </button>
        </div>

        {!isCustomMode ? (
          <>
            {/* Year Level Buttons */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                1. Year Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(yr => {
                  const isSelected = Number(formData.yearLevel) === yr;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => handleYearChange(yr)}
                      className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#064e3b] text-white border-emerald-900 shadow-md ring-2 ring-emerald-600/30'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      <span className="text-sm font-black">{yr}</span>
                      <span className="text-[9px] font-medium opacity-80">
                        {yr === 1 ? '1st Yr' : yr === 2 ? '2nd Yr' : yr === 3 ? '3rd Yr' : '4th Yr'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section Letter Buttons */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                2. Section Letter / Identifier
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {COMMON_LETTERS.map(letter => {
                  const isSelected = selectedLetter === letter;
                  const testCandidate = generateCode(formData.yearLevel || 1, letter, formatStyle, programCode);
                  const isTaken = checkDuplicate(testCandidate);

                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleLetterChange(letter)}
                      className={`py-2 px-1 rounded-xl text-xs font-black border transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? isTaken
                            ? 'bg-rose-600 text-white border-rose-700 shadow-md'
                            : 'bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500/30'
                          : isTaken
                          ? 'bg-rose-50 text-rose-500 border-rose-200 opacity-60'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                      title={isTaken ? `Section ${testCandidate} is already created` : `Select Section ${letter}`}
                    >
                      <span className="text-sm">{letter}</span>
                      {isTaken && (
                        <span className="text-[8px] font-normal leading-none mt-0.5">Taken</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section Naming Format Options */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                3. Naming Format Style
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleFormatStyleChange('compact')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    formatStyle === 'compact'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-black'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{formData.yearLevel || 1}{selectedLetter}</span>
                  <span className="block text-[9px] font-normal text-slate-500">(e.g. 2A)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFormatStyleChange('program')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    formatStyle === 'program'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-black'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{programCode} {formData.yearLevel || 1}{selectedLetter}</span>
                  <span className="block text-[9px] font-normal text-slate-500">(With Program)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFormatStyleChange('dashed')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    formatStyle === 'dashed'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-black'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{formData.yearLevel || 1}-{selectedLetter}</span>
                  <span className="block text-[9px] font-normal text-slate-500">(Hyphenated)</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Custom Typing Mode */
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Custom Section Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={e => onChange({ ...formData, code: e.target.value })}
                required
                placeholder="e.g. 2A, BSIT 2-A, or IRREG-1"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Year Level (1-4)
              </label>
              <select
                value={formData.yearLevel || 1}
                onChange={e => onChange({ ...formData, yearLevel: Number(e.target.value) })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>
          </div>
        )}

        {/* Live Preview & Duplicate Feedback Banner */}
        <div className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
          isCurrentDuplicate
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
        }`}>
          <div className="flex items-center space-x-2">
            {isCurrentDuplicate ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            )}
            <div>
              <div className="text-xs font-extrabold flex items-center space-x-1.5">
                <span>Section Code:</span>
                <span className="px-2 py-0.5 bg-white border rounded-md shadow-xs text-slate-900 font-mono text-sm font-black">
                  {formData.code || 'None'}
                </span>
              </div>
              <p className="text-[10px] font-semibold mt-0.5">
                {isCurrentDuplicate
                  ? '⚠️ This section already exists! Duplicates are not allowed.'
                  : '✓ Available and ready to use.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. STUDENT COUNT / ENROLMENT */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-700">
            Student Enrolment (Class Size)
          </label>
          <span className="text-[11px] font-bold text-emerald-800">
            {formData.studentCount || 40} Students
          </span>
        </div>
        
        {/* Quick count buttons */}
        <div className="flex items-center space-x-1.5 mb-2">
          {COMMON_STUDENT_COUNTS.map(count => (
            <button
              key={count}
              type="button"
              onClick={() => onChange({ ...formData, studentCount: count })}
              className={`flex-1 py-1 px-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                Number(formData.studentCount) === count
                  ? 'bg-emerald-800 text-white border-emerald-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {count}
            </button>
          ))}
        </div>

        <input
          type="number"
          min="1"
          max="150"
          value={formData.studentCount || 40}
          onChange={e => onChange({ ...formData, studentCount: Number(e.target.value) })}
          required
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>
    </div>
  );
}
