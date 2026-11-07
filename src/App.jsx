import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DeanDashboard from './components/DeanDashboard';
import InstructorView from './components/InstructorView';
import SectionView from './components/SectionView';
import RoomView from './components/RoomView';
import MasterManager from './components/MasterManager';
import ScheduleBlockModal from './components/ScheduleBlockModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import AutoScheduleNoticeModal from './components/AutoScheduleNoticeModal';

import { loadData, saveData, saveUIPreference, resetToDemoData, exportDataAsJSON } from './utils/storage';
import { getALLConflicts } from './utils/conflictChecker';
import { autoGenerateSchedule } from './utils/autoScheduler';
import { CheckCircle2, AlertTriangle, Sparkles, X, ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dean'); // 'dean' | 'instructors' | 'sections' | 'rooms' | 'manage'

  // Core Master Data State
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [scheduleBlocks, setScheduleBlocks] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [signatories, setSignatories] = useState([]);
  const [templateSettings, setTemplateSettings] = useState({});

  // Active Semester & Year Level Filter State
  const [selectedSemester, setSelectedSemester] = useState('1st Semester'); // '1st Semester' | '2nd Semester' | 'Summer' | 'ALL'
  const [selectedYearLevel, setSelectedYearLevel] = useState('ALL'); // 'ALL' | 1 | 2 | 3 | 4

  // Last Saved Indicator State
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Toast / Modal Feedback
  const [toastMessage, setToastMessage] = useState(null);
  const [autoScheduleLogs, setAutoScheduleLogs] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [modalInitialDay, setModalInitialDay] = useState('Monday');
  const [modalInitialTime, setModalInitialTime] = useState('07:30');

  // Confirmation Modal State for Safe Deletions & Vacating Slots
  const [deleteConfirmModalData, setDeleteConfirmModalData] = useState(null);

  // Load state on mount
  useEffect(() => {
    const data = loadData();
    setTeachers(data.teachers);
    setRooms(data.rooms);
    setSubjects(data.subjects);
    setSections(data.sections);
    setScheduleBlocks(data.scheduleBlocks);
    setPrograms(data.programs || []);
    setSignatories(data.signatories || []);
    setTemplateSettings(data.templateSettings || {});
    if (data.activeTab) setActiveTab(data.activeTab);
    if (data.selectedSemester) setSelectedSemester(data.selectedSemester);
    if (data.selectedYearLevel) setSelectedYearLevel(data.selectedYearLevel);
    if (data.lastSaved) setLastSavedTime(data.lastSaved);
  }, []);

  const handleSetActiveTab = tab => {
    setActiveTab(tab);
    saveUIPreference('ACTIVE_TAB', tab);
  };

  const handleSetSelectedSemester = sem => {
    setSelectedSemester(sem);
    saveUIPreference('SELECTED_SEMESTER', sem);
  };

  const handleSetSelectedYearLevel = yr => {
    setSelectedYearLevel(yr);
    saveUIPreference('SELECTED_YEAR', yr);
  };

  const saveAndTrack = (key, data) => {
    const ts = saveData(key, data);
    if (ts) setLastSavedTime(ts);
    return ts;
  };

  // Filter schedule blocks by active Semester & Year Level
  const activeScheduleBlocks = scheduleBlocks.filter(b => {
    if (selectedSemester !== 'ALL') {
      const sub = subjects.find(s => s.id === b.subjectId);
      const sem = b.semester || sub?.semester || '1st Semester';
      if (sem !== selectedSemester && sem !== 'Both' && sem !== 'All') return false;
    }
    if (selectedYearLevel !== 'ALL') {
      const sec = sections.find(s => s.id === b.sectionId);
      if (sec && String(sec.yearLevel) !== String(selectedYearLevel)) return false;
    }
    return true;
  });

  const asynchronousDays = templateSettings?.asynchronousDays || ['Wednesday'];

  // Compute live conflicts
  const conflicts = getALLConflicts(activeScheduleBlocks, rooms, teachers, subjects, sections, asynchronousDays);
  const conflictCount = Object.keys(conflicts).length;

  // Helper trigger to show toast notifications
  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Schedule Block handlers
  const handleOpenAddModal = (day = 'Monday', startTime = '07:30') => {
    setEditingBlock(null);
    setModalInitialDay(day);
    setModalInitialTime(startTime);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = block => {
    setEditingBlock(block);
    setIsModalOpen(true);
  };

  const handleSaveBlock = blockData => {
    let updated;
    if (Array.isArray(blockData)) {
      const blocksWithSem = blockData.map((b, idx) => ({
        ...b,
        id: b.id || `block-${Date.now()}-${idx}`,
        semester: b.semester || selectedSemester
      }));
      if (editingBlock) {
        const remaining = scheduleBlocks.filter(b => b.id !== editingBlock.id);
        updated = [...remaining, ...blocksWithSem];
      } else {
        updated = [...scheduleBlocks, ...blocksWithSem];
      }
      setScheduleBlocks(updated);
      saveData('SCHEDULE_BLOCKS', updated);
      showToast(`${blocksWithSem.length} class sessions scheduled!`);
      return;
    }

    const blockWithSem = { ...blockData, semester: blockData.semester || selectedSemester };
    if (editingBlock) {
      updated = scheduleBlocks.map(b => (b.id === blockData.id ? blockWithSem : b));
    } else {
      updated = [...scheduleBlocks, { ...blockWithSem, id: blockData.id || `block-${Date.now()}` }];
    }
    setScheduleBlocks(updated);
    saveData('SCHEDULE_BLOCKS', updated);
    showToast(editingBlock ? 'Schedule block updated!' : 'New class block scheduled!');
  };

  const handleDeleteBlock = blockId => {
    const block = scheduleBlocks.find(b => b.id === blockId);
    const sub = subjects.find(s => s.id === block?.subjectId);
    const sec = sections.find(s => s.id === block?.sectionId);
    const itemDesc = block ? `${sub?.code || 'Session'} for ${sec?.code || 'Section'} (${block.day} ${block.startTime}-${block.endTime})` : 'Class session block';

    setDeleteConfirmModalData({
      isOpen: true,
      title: 'Confirm Class Session Deletion',
      itemName: itemDesc,
      itemType: 'scheduled class block',
      affectedBlocksCount: 1,
      details: 'This will remove the class block and vacate the slot on the Dean Workstation timetable grid.',
      onConfirm: () => {
        const updated = scheduleBlocks.filter(b => b.id !== blockId);
        setScheduleBlocks(updated);
        saveData('SCHEDULE_BLOCKS', updated);
        showToast('Class block deleted and timetable slot vacated.', 'info');
      }
    });
  };

  // Auto-Scheduler Handler with strict conflict blocking, semester and year level scoping
  const handleAutoSchedule = () => {
    const result = autoGenerateSchedule(
      sections,
      subjects,
      teachers,
      rooms,
      scheduleBlocks,
      'rebuild',
      selectedSemester,
      selectedYearLevel,
      asynchronousDays
    );
    setScheduleBlocks(result.newBlocks);
    saveData('SCHEDULE_BLOCKS', result.newBlocks);
    setAutoScheduleLogs(result);

    if (result.blockedConflictReports && result.blockedConflictReports.length > 0) {
      showToast(`Auto-scheduler placed ${result.addedCount} sessions for ${selectedSemester} (${result.blockedConflictReports.length} blocked due to conflicts)`, 'warning');
    } else {
      showToast(`Auto-scheduler placed ${result.addedCount} class sessions for ${selectedSemester} cleanly!`);
    }
  };

  // Signatories & Document Template Settings Save Handlers
  const handleSaveSignatories = newSignatories => {
    setSignatories(newSignatories);
    saveData('SIGNATORIES', newSignatories);
    showToast('Signatories updated!');
  };

  const handleSaveTemplateSettings = newSettings => {
    setTemplateSettings(newSettings);
    saveData('TEMPLATE_SETTINGS', newSettings);
    showToast('Template Settings saved!');
  };

  const handleResetSignatories = () => {
    const demo = resetToDemoData();
    if (demo) {
      setSignatories(demo.signatories);
      setTemplateSettings(demo.templateSettings);
      showToast('Reset signatories to default!');
    }
  };

  // Instructor Availability Preference Save
  const handleSaveTeacherAvailability = (teacherId, availability) => {
    const updatedTeachers = teachers.map(t =>
      t.id === teacherId ? { ...t, availability } : t
    );
    setTeachers(updatedTeachers);
    saveData('TEACHERS', updatedTeachers);
    showToast('Instructor time preferences saved to system!');
  };

  // Data Reset & Backup/Restore Handlers
  const handleResetDemo = () => {
    if (confirm('Reset all schedule data back to default CBSUA demo entries? (Current changes will be replaced)')) {
      const demo = resetToDemoData();
      if (demo) {
        setTeachers(demo.teachers);
        setRooms(demo.rooms);
        setSubjects(demo.subjects);
        setSections(demo.sections);
        setScheduleBlocks(demo.scheduleBlocks);
        showToast('Reset to default CBSUA demo data!');
      }
    }
  };

  const handleImportBackup = file => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.teachers && parsed.rooms && parsed.subjects && parsed.sections && parsed.scheduleBlocks) {
          setTeachers(parsed.teachers);
          setRooms(parsed.rooms);
          setSubjects(parsed.subjects);
          setSections(parsed.sections);
          setScheduleBlocks(parsed.scheduleBlocks);

          if (parsed.programs) {
            setPrograms(parsed.programs);
            saveData('PROGRAMS', parsed.programs);
          }
          if (parsed.signatories) {
            setSignatories(parsed.signatories);
            saveData('SIGNATORIES', parsed.signatories);
          }
          if (parsed.templateSettings) {
            setTemplateSettings(parsed.templateSettings);
            saveData('TEMPLATE_SETTINGS', parsed.templateSettings);
          }

          saveData('TEACHERS', parsed.teachers);
          saveData('ROOMS', parsed.rooms);
          saveData('SUBJECTS', parsed.subjects);
          saveData('SECTIONS', parsed.sections);
          const ts = saveData('SCHEDULE_BLOCKS', parsed.scheduleBlocks);
          if (ts) setLastSavedTime(ts);

          showToast('Backup JSON schedule data imported successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // CRUD Handlers for Master Data
  const handleSaveRoom = room => {
    const exists = rooms.some(r => r.id === room.id);
    const updated = exists ? rooms.map(r => (r.id === room.id ? room : r)) : [...rooms, room];
    setRooms(updated);
    saveData('ROOMS', updated);
    showToast('Room entry saved.');
  };

  const handleDeleteRoom = roomId => {
    const room = rooms.find(r => r.id === roomId);
    const affected = scheduleBlocks.filter(b => b.roomId === roomId);

    setDeleteConfirmModalData({
      isOpen: true,
      title: 'Confirm Room Deletion',
      itemName: room ? `${room.name} (${room.type || 'Room'})` : 'Room entry',
      itemType: 'room',
      affectedBlocksCount: affected.length,
      details: 'Deleting this room will automatically vacate all schedule blocks assigned to it.',
      onConfirm: () => {
        const updatedRooms = rooms.filter(r => r.id !== roomId);
        setRooms(updatedRooms);
        saveData('ROOMS', updatedRooms);

        const updatedBlocks = scheduleBlocks.filter(b => b.roomId !== roomId);
        setScheduleBlocks(updatedBlocks);
        saveData('SCHEDULE_BLOCKS', updatedBlocks);

        showToast(`Room deleted and ${affected.length} timetable slot(s) vacated.`, 'info');
      }
    });
  };

  const handleSaveSubject = sub => {
    const exists = subjects.some(s => s.id === sub.id);
    const updated = exists ? subjects.map(s => (s.id === sub.id ? sub : s)) : [...subjects, sub];
    setSubjects(updated);
    saveData('SUBJECTS', updated);
    showToast('Subject entry saved.');
  };

  const handleDeleteSubject = subId => {
    const sub = subjects.find(s => s.id === subId);
    const affected = scheduleBlocks.filter(b => b.subjectId === subId);

    setDeleteConfirmModalData({
      isOpen: true,
      title: 'Confirm Subject Deletion',
      itemName: sub ? `${sub.code} - ${sub.name}` : 'Subject entry',
      itemType: 'subject',
      affectedBlocksCount: affected.length,
      details: 'Deleting this subject will remove all scheduled sessions for it and unassign it from instructors.',
      onConfirm: () => {
        const updatedSubs = subjects.filter(s => s.id !== subId);
        setSubjects(updatedSubs);
        saveData('SUBJECTS', updatedSubs);

        const updatedBlocks = scheduleBlocks.filter(b => b.subjectId !== subId);
        setScheduleBlocks(updatedBlocks);
        saveData('SCHEDULE_BLOCKS', updatedBlocks);

        const updatedTeachers = teachers.map(t => ({
          ...t,
          assignedSubjectIds: (t.assignedSubjectIds || []).filter(id => id !== subId),
          assignedSectionSubjectPairs: (t.assignedSectionSubjectPairs || []).filter(p => p.subjectId !== subId)
        }));
        setTeachers(updatedTeachers);
        saveData('TEACHERS', updatedTeachers);

        showToast(`Subject deleted and ${affected.length} timetable slot(s) vacated.`, 'info');
      }
    });
  };

  const handleSaveTeacher = prof => {
    const exists = teachers.some(t => t.id === prof.id);
    const updated = exists ? teachers.map(t => (t.id === prof.id ? prof : t)) : [...teachers, prof];
    setTeachers(updated);
    saveData('TEACHERS', updated);
    showToast('Instructor saved.');
  };

  const handleDeleteTeacher = profId => {
    const prof = teachers.find(t => t.id === profId);
    const affected = scheduleBlocks.filter(b => b.teacherId === profId);

    setDeleteConfirmModalData({
      isOpen: true,
      title: 'Confirm Instructor Deletion',
      itemName: prof ? prof.name : 'Instructor profile',
      itemType: 'instructor profile',
      affectedBlocksCount: affected.length,
      details: 'Deleting this instructor will vacate all class sessions currently assigned to them.',
      onConfirm: () => {
        const updatedTeachers = teachers.filter(t => t.id !== profId);
        setTeachers(updatedTeachers);
        saveData('TEACHERS', updatedTeachers);

        const updatedBlocks = scheduleBlocks.filter(b => b.teacherId !== profId);
        setScheduleBlocks(updatedBlocks);
        saveData('SCHEDULE_BLOCKS', updatedBlocks);

        showToast(`Instructor deleted and ${affected.length} timetable slot(s) vacated.`, 'info');
      }
    });
  };

  const handleSaveSection = sec => {
    const exists = sections.some(s => s.id === sec.id);
    const updated = exists ? sections.map(s => (s.id === sec.id ? sec : s)) : [...sections, sec];
    setSections(updated);
    saveData('SECTIONS', updated);
    showToast('Section saved.');
  };

  const handleDeleteSection = secId => {
    const sec = sections.find(s => s.id === secId);
    const affected = scheduleBlocks.filter(b => b.sectionId === secId);

    setDeleteConfirmModalData({
      isOpen: true,
      title: 'Confirm Section Deletion',
      itemName: sec ? `${sec.code} (${sec.program})` : 'Class section',
      itemType: 'class section',
      affectedBlocksCount: affected.length,
      details: 'Deleting this section will remove all class sessions scheduled for it.',
      onConfirm: () => {
        const updatedSections = sections.filter(s => s.id !== secId);
        setSections(updatedSections);
        saveData('SECTIONS', updatedSections);

        const updatedBlocks = scheduleBlocks.filter(b => b.sectionId !== secId);
        setScheduleBlocks(updatedBlocks);
        saveData('SCHEDULE_BLOCKS', updatedBlocks);

        const updatedTeachers = teachers.map(t => ({
          ...t,
          assignedSectionSubjectPairs: (t.assignedSectionSubjectPairs || []).filter(p => p.sectionId !== secId)
        }));
        setTeachers(updatedTeachers);
        saveData('TEACHERS', updatedTeachers);

        showToast(`Section deleted and ${affected.length} timetable slot(s) vacated.`, 'info');
      }
    });
  };

  const handleSaveProgram = prog => {
    const exists = programs.some(p => p.id === prog.id);
    const updated = exists ? programs.map(p => (p.id === prog.id ? prog : p)) : [...programs, prog];
    setPrograms(updated);
    saveData('PROGRAMS', updated);
    showToast('Academic Program saved.');
  };

  const handleDeleteProgram = progId => {
    const prog = programs.find(p => p.id === progId);

    setDeleteConfirmModalData({
      isOpen: true,
      title: 'Confirm Academic Program Deletion',
      itemName: prog ? `${prog.code} - ${prog.name}` : 'Academic program',
      itemType: 'academic program',
      affectedBlocksCount: 0,
      details: 'Deleting an academic program will remove its program registry entry.',
      onConfirm: () => {
        const updatedPrograms = programs.filter(p => p.id !== progId);
        setPrograms(updatedPrograms);
        saveData('PROGRAMS', updatedPrograms);
        showToast('Academic Program deleted.', 'info');
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-poppins selection:bg-emerald-600 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        onAutoSchedule={handleAutoSchedule}
        onResetDemo={handleResetDemo}
        onExportBackup={exportDataAsJSON}
        onImportBackup={handleImportBackup}
        conflictCount={conflictCount}
        selectedSemester={selectedSemester}
        setSelectedSemester={handleSetSelectedSemester}
        selectedYearLevel={selectedYearLevel}
        setSelectedYearLevel={handleSetSelectedYearLevel}
        lastSavedTime={lastSavedTime}
      />

      {/* Main View Area */}
      <main className="w-full max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dean' && (
          <DeanDashboard
            blocks={activeScheduleBlocks}
            subjects={subjects}
            teachers={teachers}
            rooms={rooms}
            sections={sections}
            conflicts={conflicts}
            signatories={signatories}
            templateSettings={templateSettings}
            selectedSemester={selectedSemester}
            selectedYearLevel={selectedYearLevel}
            onAddBlock={handleOpenAddModal}
            onEditBlock={handleOpenEditModal}
            onDeleteBlock={handleDeleteBlock}
            onAutoSchedule={handleAutoSchedule}
            onSaveTemplateSettings={handleSaveTemplateSettings}
            onSaveSignatories={handleSaveSignatories}
            onResetDefault={handleResetSignatories}
          />
        )}

        {activeTab === 'instructors' && (
          <InstructorView
            teachers={teachers}
            subjects={subjects}
            rooms={rooms}
            sections={sections}
            blocks={activeScheduleBlocks}
            conflicts={conflicts}
            signatories={signatories}
            templateSettings={templateSettings}
            selectedSemester={selectedSemester}
            asynchronousDays={asynchronousDays}
            onSaveTeacherAvailability={handleSaveTeacherAvailability}
            onSaveSignatories={handleSaveSignatories}
            onSaveTemplateSettings={handleSaveTemplateSettings}
            onResetSignatories={handleResetSignatories}
          />
        )}

        {activeTab === 'sections' && (
          <SectionView
            sections={sections}
            subjects={subjects}
            teachers={teachers}
            rooms={rooms}
            blocks={activeScheduleBlocks}
            conflicts={conflicts}
            signatories={signatories}
            templateSettings={templateSettings}
            selectedSemester={selectedSemester}
            onSaveSignatories={handleSaveSignatories}
            onSaveTemplateSettings={handleSaveTemplateSettings}
            onResetSignatories={handleResetSignatories}
          />
        )}

        {activeTab === 'rooms' && (
          <RoomView
            rooms={rooms}
            subjects={subjects}
            teachers={teachers}
            sections={sections}
            blocks={activeScheduleBlocks}
            conflicts={conflicts}
            asynchronousDays={asynchronousDays}
          />
        )}

        {activeTab === 'manage' && (
          <MasterManager
            rooms={rooms}
            subjects={subjects}
            teachers={teachers}
            sections={sections}
            programs={programs}
            scheduleBlocks={scheduleBlocks}
            onSaveRoom={handleSaveRoom}
            onDeleteRoom={handleDeleteRoom}
            onSaveSubject={handleSaveSubject}
            onDeleteSubject={handleDeleteSubject}
            onSaveTeacher={handleSaveTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onSaveSection={handleSaveSection}
            onDeleteSection={handleDeleteSection}
            onSaveProgram={handleSaveProgram}
            onDeleteProgram={handleDeleteProgram}
          />
        )}
      </main>

      {/* Add / Edit Block Modal */}
      <ScheduleBlockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBlock}
        blockToEdit={editingBlock}
        initialDay={modalInitialDay}
        initialTime={modalInitialTime}
        sections={sections}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
        existingBlocks={scheduleBlocks}
        asynchronousDays={asynchronousDays}
      />

      {/* Auto-Scheduler Notice & Diagnostic Action Modal */}
      <AutoScheduleNoticeModal
        isOpen={Boolean(autoScheduleLogs)}
        onClose={() => setAutoScheduleLogs(null)}
        reportData={autoScheduleLogs}
        onGoToWorkstation={(targetSectionId) => {
          setActiveTab('dean');
          setAutoScheduleLogs(null);
          const sec = sections.find(s => s.id === targetSectionId);
          showToast(`Switched to Dean Workstation${sec ? ` for ${sec.code}` : ''}!`);
        }}
        sections={sections}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmModalData && (
        <ConfirmDeleteModal
          isOpen={deleteConfirmModalData.isOpen}
          onClose={() => setDeleteConfirmModalData(null)}
          onConfirm={deleteConfirmModalData.onConfirm}
          title={deleteConfirmModalData.title}
          itemName={deleteConfirmModalData.itemName}
          itemType={deleteConfirmModalData.itemType}
          affectedBlocksCount={deleteConfirmModalData.affectedBlocksCount}
          details={deleteConfirmModalData.details}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="bg-[#064e3b] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-xs border border-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold">{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
