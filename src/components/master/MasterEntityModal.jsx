import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import RoomForm from './forms/RoomForm';
import SubjectForm from './forms/SubjectForm';
import TeacherForm from './forms/TeacherForm';
import SectionForm from './forms/SectionForm';
import ProgramForm from './forms/ProgramForm';

export default function MasterEntityModal({
  isOpen,
  onClose,
  onSubmit,
  activeSubTab,
  editingItem,
  formError,
  // Form states and setters
  roomFormData,
  setRoomFormData,
  subjectFormData,
  setSubjectFormData,
  teacherFormData,
  setTeacherFormData,
  sectionFormData,
  setSectionFormData,
  programFormData,
  setProgramFormData,
  // Context datasets
  rooms = [],
  programs = [],
  subjects = [],
  sections = [],
  teachers = [],
  scheduleBlocks = []
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-hidden font-poppins">
      <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">
            {editingItem ? 'Edit' : 'Create New'} {activeSubTab.slice(0, -1).toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Feedback */}
        {formError && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-950 font-bold flex items-center space-x-2 animate-in fade-in shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={onSubmit} className="my-3 space-y-4 overflow-y-auto pr-1.5 flex-1 max-h-[65vh]">
          {activeSubTab === 'rooms' && (
            <RoomForm formData={roomFormData} onChange={setRoomFormData} />
          )}

          {activeSubTab === 'subjects' && (
            <SubjectForm
              formData={subjectFormData}
              onChange={setSubjectFormData}
              rooms={rooms}
              programs={programs}
              subjects={subjects}
              editingItem={editingItem}
            />
          )}

          {activeSubTab === 'teachers' && (
            <TeacherForm
              formData={teacherFormData}
              onChange={setTeacherFormData}
              programs={programs}
              subjects={subjects}
              sections={sections}
              teachers={teachers}
              scheduleBlocks={scheduleBlocks}
              editingItem={editingItem}
            />
          )}

          {activeSubTab === 'sections' && (
            <SectionForm
              formData={sectionFormData}
              onChange={setSectionFormData}
              programs={programs}
              sections={sections}
              editingItem={editingItem}
            />
          )}

          {activeSubTab === 'programs' && (
            <ProgramForm
              formData={programFormData}
              onChange={setProgramFormData}
            />
          )}

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 shrink-0 bg-white sticky bottom-0 mt-2 z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md transition-all active:scale-95"
            >
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
