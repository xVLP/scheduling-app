import React, { useState } from 'react';
import { 
  Building2, 
  BookOpen, 
  UserCheck, 
  Users, 
  Plus, 
  Layers, 
  GraduationCap 
} from 'lucide-react';

import RoomsTab from './master/RoomsTab';
import SubjectsTab from './master/SubjectsTab';
import TeachersTab from './master/TeachersTab';
import SectionsTab from './master/SectionsTab';
import ProgramsTab from './master/ProgramsTab';
import MasterEntityModal from './master/MasterEntityModal';

export default function MasterManager({
  rooms = [],
  subjects = [],
  teachers = [],
  sections = [],
  programs = [],
  scheduleBlocks = [],
  onSaveRoom,
  onDeleteRoom,
  onSaveSubject,
  onDeleteSubject,
  onSaveTeacher,
  onDeleteTeacher,
  onSaveSection,
  onDeleteSection,
  onSaveProgram,
  onDeleteProgram
}) {
  const [activeSubTab, setActiveSubTab] = useState('rooms');

  // Form Modals / Inline Edit state
  const [editingItem, setEditingItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState('');

  // Form States
  const [roomFormData, setRoomFormData] = useState({ name: '', building: '', type: 'Lecture', capacity: 40 });
  const [programFormData, setProgramFormData] = useState({ code: '', name: '', department: 'College of Computer Studies' });
  const [subjectFormData, setSubjectFormData] = useState({
    code: '',
    name: '',
    department: 'College of Computer Studies',
    semester: '1st Semester',
    yearLevel: 1,
    units: 3,
    totalHours: 5,
    lecHours: 2,
    labHours: 3,
    defaultLecRoomId: '',
    defaultLabRoomId: '',
    allowedLecRoomIds: [],
    allowedLabRoomIds: [],
    color: '#059669'
  });
  const [teacherFormData, setTeacherFormData] = useState({
    name: '',
    department: 'College of Computer Studies',
    employmentType: 'Permanent',
    maxUnits: 21,
    maxHours: 20,
    assignedSubjectIds: [],
    assignedSectionSubjectPairs: []
  });
  const [sectionFormData, setSectionFormData] = useState({
    code: '',
    program: programs[0]?.name || 'BS Computer Science',
    yearLevel: 1,
    studentCount: 40
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormError('');

    if (activeSubTab === 'rooms') {
      setRoomFormData({ name: '', building: '', type: 'Lecture', capacity: 40 });
    }
    if (activeSubTab === 'programs') {
      setProgramFormData({ code: '', name: '', department: 'College of Computer Studies' });
    }
    if (activeSubTab === 'subjects') {
      const firstLecRoom = rooms.find(r => r.type === 'Lecture' || r.type === 'AVR' || r.type === 'Lecture & Laboratory') || rooms[0];
      const firstLabRoom = rooms.find(r => r.type === 'Laboratory' || r.type === 'Lecture & Laboratory') || rooms[0];
      setSubjectFormData({
        code: '',
        name: '',
        department: programs[0]?.name || 'College of Computer Studies',
        semester: '1st Semester',
        yearLevel: 1,
        units: 3,
        totalHours: 5,
        lecHours: 2,
        labHours: 3,
        defaultLecRoomId: firstLecRoom?.id || '',
        defaultLabRoomId: firstLabRoom?.id || '',
        allowedLecRoomIds: firstLecRoom ? [firstLecRoom.id] : [],
        allowedLabRoomIds: firstLabRoom ? [firstLabRoom.id] : [],
        color: '#059669'
      });
    }
    if (activeSubTab === 'teachers') {
      setTeacherFormData({
        name: '',
        department: programs[0]?.department || 'College of Computer Studies',
        employmentType: 'Permanent',
        maxUnits: 24,
        maxHours: 30,
        assignedSubjectIds: [],
        assignedSectionSubjectPairs: []
      });
    }
    if (activeSubTab === 'sections') {
      setSectionFormData({
        code: '',
        program: programs[0]?.name || 'BS Computer Science',
        yearLevel: 1,
        studentCount: 40
      });
    }
    setIsFormOpen(true);
  };

  const handleOpenEdit = item => {
    setEditingItem(item);
    setFormError('');

    if (activeSubTab === 'rooms') {
      setRoomFormData({ ...item });
    }
    if (activeSubTab === 'programs') {
      setProgramFormData({ ...item });
    }
    if (activeSubTab === 'subjects') {
      setSubjectFormData({
        ...item,
        allowedLecRoomIds: item.allowedLecRoomIds || (item.defaultLecRoomId ? [item.defaultLecRoomId] : []),
        allowedLabRoomIds: item.allowedLabRoomIds || (item.defaultLabRoomId ? [item.defaultLabRoomId] : [])
      });
    }
    if (activeSubTab === 'teachers') {
      setTeacherFormData({
        employmentType: 'Permanent',
        maxUnits: 24,
        maxHours: 30,
        ...item,
        assignedSubjectIds: item.assignedSubjectIds || [],
        assignedSectionSubjectPairs: item.assignedSectionSubjectPairs || []
      });
    }
    if (activeSubTab === 'sections') {
      setSectionFormData({ ...item });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = e => {
    e.preventDefault();
    setFormError('');

    if (activeSubTab === 'rooms') {
      const roomNameClean = roomFormData.name.trim();
      if (!roomNameClean) {
        setFormError('Please enter a valid room name.');
        return;
      }
      const isDuplicate = rooms.some(
        r => r.id !== editingItem?.id && r.name.trim().toLowerCase() === roomNameClean.toLowerCase()
      );
      if (isDuplicate) {
        setFormError(`⚠️ Room "${roomNameClean}" already exists! Duplicate rooms are not allowed.`);
        return;
      }

      onSaveRoom({
        id: editingItem?.id || `room-${Date.now()}`,
        ...roomFormData,
        name: roomNameClean,
        capacity: Number(roomFormData.capacity)
      });
    } else if (activeSubTab === 'programs') {
      const progCodeClean = programFormData.code.trim();
      const progNameClean = programFormData.name.trim();
      
      const isDuplicate = programs.some(
        p => p.id !== editingItem?.id && (
          p.code.trim().toLowerCase() === progCodeClean.toLowerCase() ||
          p.name.trim().toLowerCase() === progNameClean.toLowerCase()
        )
      );
      if (isDuplicate) {
        setFormError(`⚠️ Program code "${progCodeClean}" or title already exists! Duplicate programs are not allowed.`);
        return;
      }

      onSaveProgram({
        id: editingItem?.id || `prog-${Date.now()}`,
        ...programFormData,
        code: progCodeClean,
        name: progNameClean
      });
    } else if (activeSubTab === 'subjects') {
      const subCodeClean = (subjectFormData.code || '').trim();
      const subNameClean = (subjectFormData.name || '').trim();

      if (!subCodeClean || subCodeClean.length < 2) {
        setFormError('⚠️ Please enter a valid Subject Code (e.g. CC 101).');
        return;
      }

      if (!subNameClean || subNameClean.length < 3) {
        setFormError('⚠️ Please enter the complete Subject Title (at least 3 characters).');
        return;
      }

      // Smart duplicate code check (case-insensitive & space-normalized)
      const normCode = subCodeClean.toLowerCase().replace(/\s+/g, '');
      const isDuplicateCode = subjects.some(
        s => s.id !== editingItem?.id && s.code.toLowerCase().replace(/\s+/g, '') === normCode
      );
      if (isDuplicateCode) {
        setFormError(`⚠️ Subject Code "${subCodeClean}" already exists. Duplicate subjects are not allowed.`);
        return;
      }

      // Duplicate subject title check
      const isDuplicateName = subjects.some(
        s => s.id !== editingItem?.id && s.name.trim().toLowerCase() === subNameClean.toLowerCase()
      );
      if (isDuplicateName) {
        setFormError(`⚠️ A subject with the title "${subNameClean}" already exists.`);
        return;
      }

      const units = Number(subjectFormData.units);
      if (isNaN(units) || units < 1 || units > 12) {
        setFormError('⚠️ Units must be between 1 and 12.');
        return;
      }

      const lecH = Number(subjectFormData.lecHours || 0);
      const labH = Number(subjectFormData.labHours || 0);
      if (isNaN(lecH) || lecH < 0 || isNaN(labH) || labH < 0 || (lecH === 0 && labH === 0)) {
        setFormError('⚠️ Subject must have at least 1 hour of lecture or laboratory.');
        return;
      }

      onSaveSubject({
        id: editingItem?.id || `sub-${Date.now()}`,
        ...subjectFormData,
        code: subCodeClean,
        name: subNameClean,
        semester: subjectFormData.semester || '1st Semester',
        yearLevel: Number(subjectFormData.yearLevel || 1),
        units,
        totalHours: lecH + labH,
        lecHours: lecH,
        labHours: labH
      });
    } else if (activeSubTab === 'teachers') {
      const teacherNameClean = (teacherFormData.name || '').trim();
      if (!teacherNameClean || teacherNameClean.length < 3) {
        setFormError('⚠️ Please provide the instructor\'s full name (at least 3 characters).');
        return;
      }

      const isDuplicate = teachers.some(
        t => t.id !== editingItem?.id && t.name.trim().toLowerCase() === teacherNameClean.toLowerCase()
      );
      if (isDuplicate) {
        setFormError(`⚠️ Instructor "${teacherNameClean}" is already registered. Duplicates are not allowed.`);
        return;
      }

      const maxU = Number(teacherFormData.maxUnits);
      if (isNaN(maxU) || maxU < 1 || maxU > 40) {
        setFormError('⚠️ Max Units limit must be between 1 and 40.');
        return;
      }

      const maxH = Number(teacherFormData.maxHours);
      if (isNaN(maxH) || maxH < 1 || maxH > 50) {
        setFormError('⚠️ Max Teaching Hours limit must be between 1 and 50.');
        return;
      }

      // Check if any section-subject pair is already assigned to another teacher
      const currentPairs = teacherFormData.assignedSectionSubjectPairs || [];
      for (const pair of currentPairs) {
        const otherTeacher = teachers.find(
          t => t.id !== editingItem?.id &&
          (t.assignedSectionSubjectPairs || []).some(p => p.subjectId === pair.subjectId && p.sectionId === pair.sectionId)
        );
        if (otherTeacher) {
          const subObj = subjects.find(s => s.id === pair.subjectId);
          const secObj = sections.find(s => s.id === pair.sectionId);
          setFormError(`⚠️ Section "${secObj?.code || 'Section'}" for ${subObj?.code || 'Subject'} is already assigned to ${otherTeacher.name}. Each section can only be assigned to one instructor per subject.`);
          return;
        }
      }

      onSaveTeacher({
        id: editingItem?.id || `prof-${Date.now()}`,
        ...teacherFormData,
        name: teacherNameClean,
        employmentType: teacherFormData.employmentType || 'Permanent',
        maxUnits: maxU,
        maxHours: maxH,
        availability: editingItem?.availability || {}
      });
    } else if (activeSubTab === 'sections') {
      const secCodeClean = (sectionFormData.code || '').trim();
      if (!secCodeClean) {
        setFormError('⚠️ Please enter or select a section code (e.g. 2A).');
        return;
      }

      // Smart duplicate check (matches 2A vs 2-A vs 2 A)
      const normSec = secCodeClean.toLowerCase().replace(/[-\s]/g, '');
      const isDuplicate = sections.some(
        sec => sec.id !== editingItem?.id && (
          sec.code.trim().toLowerCase() === secCodeClean.toLowerCase() ||
          sec.code.toLowerCase().replace(/[-\s]/g, '') === normSec
        )
      );
      if (isDuplicate) {
        setFormError(`⚠️ Section "${secCodeClean}" already exists. Duplicate sections are not allowed.`);
        return;
      }

      const count = Number(sectionFormData.studentCount);
      if (isNaN(count) || count < 1 || count > 150) {
        setFormError('⚠️ Student count must be between 1 and 150.');
        return;
      }

      const yr = Number(sectionFormData.yearLevel);
      if (isNaN(yr) || yr < 1 || yr > 4) {
        setFormError('⚠️ Please select a valid year level (1st to 4th Year).');
        return;
      }

      if (!sectionFormData.program) {
        setFormError('⚠️ Please select an academic program for the section.');
        return;
      }

      onSaveSection({
        id: editingItem?.id || `sec-${Date.now()}`,
        ...sectionFormData,
        code: secCodeClean,
        yearLevel: yr,
        studentCount: count
      });
    }

    setIsFormOpen(false);
  };

  const handleQuickAddSection = (yearLevel, letter, programName) => {
    const code = `${yearLevel}${letter}`;
    const cleanTest = code.toLowerCase().replace(/[-\s]/g, '');
    const isDuplicate = sections.some(
      s => s.code.toLowerCase().replace(/[-\s]/g, '') === cleanTest
    );
    if (isDuplicate) {
      alert(`⚠️ Section "${code}" already exists in the list.`);
      return;
    }

    const targetProg = programName || programs[0]?.name || 'BS Information Technology';
    onSaveSection({
      id: `sec-${Date.now()}`,
      code,
      program: targetProg,
      yearLevel: Number(yearLevel),
      studentCount: 40
    });
  };

  return (
    <div className="space-y-6 font-poppins">
      {/* Header & Subtabs Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold shadow-inner">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Master Data Registry (CRUD)</h1>
              <p className="text-xs text-slate-500 font-medium">Manage CBSUA Rooms, Subjects, Instructors, and Sections</p>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center px-4 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New {activeSubTab.slice(0, -1).toUpperCase()}
          </button>
        </div>

        {/* Segmented Pill Navigation Tab Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 inline-flex flex-wrap gap-1">
            <button
              onClick={() => setActiveSubTab('rooms')}
              className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'rooms'
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-900 hover:bg-white/80'
              }`}
            >
              <Building2 className="w-4 h-4 mr-1.5" />
              Rooms ({rooms.length})
            </button>

            <button
              onClick={() => setActiveSubTab('subjects')}
              className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'subjects'
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-900 hover:bg-white/80'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-1.5" />
              Subjects ({subjects.length})
            </button>

            <button
              onClick={() => setActiveSubTab('teachers')}
              className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'teachers'
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-900 hover:bg-white/80'
              }`}
            >
              <UserCheck className="w-4 h-4 mr-1.5" />
              Instructors ({teachers.length})
            </button>

            <button
              onClick={() => setActiveSubTab('sections')}
              className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'sections'
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-900 hover:bg-white/80'
              }`}
            >
              <Users className="w-4 h-4 mr-1.5" />
              Sections ({sections.length})
            </button>

            <button
              onClick={() => setActiveSubTab('programs')}
              className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'programs'
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-900 hover:bg-white/80'
              }`}
            >
              <GraduationCap className="w-4 h-4 mr-1.5" />
              Programs ({programs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Active Tab View */}
      {activeSubTab === 'rooms' && (
        <RoomsTab
          rooms={rooms}
          onEdit={handleOpenEdit}
          onDelete={onDeleteRoom}
        />
      )}

      {activeSubTab === 'subjects' && (
        <SubjectsTab
          subjects={subjects}
          rooms={rooms}
          onEdit={handleOpenEdit}
          onDelete={onDeleteSubject}
        />
      )}

      {activeSubTab === 'teachers' && (
        <TeachersTab
          teachers={teachers}
          subjects={subjects}
          sections={sections}
          scheduleBlocks={scheduleBlocks}
          onEdit={handleOpenEdit}
          onDelete={onDeleteTeacher}
        />
      )}

      {activeSubTab === 'sections' && (
        <SectionsTab
          sections={sections}
          programs={programs}
          onEdit={handleOpenEdit}
          onDelete={onDeleteSection}
          onQuickAdd={handleQuickAddSection}
        />
      )}

      {activeSubTab === 'programs' && (
        <ProgramsTab
          programs={programs}
          onEdit={handleOpenEdit}
          onDelete={onDeleteProgram}
        />
      )}

      {/* CRUD Form Modal */}
      <MasterEntityModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        activeSubTab={activeSubTab}
        editingItem={editingItem}
        formError={formError}
        roomFormData={roomFormData}
        setRoomFormData={setRoomFormData}
        subjectFormData={subjectFormData}
        setSubjectFormData={setSubjectFormData}
        teacherFormData={teacherFormData}
        setTeacherFormData={setTeacherFormData}
        sectionFormData={sectionFormData}
        setSectionFormData={setSectionFormData}
        programFormData={programFormData}
        setProgramFormData={setProgramFormData}
        rooms={rooms}
        programs={programs}
        subjects={subjects}
        sections={sections}
        teachers={teachers}
        scheduleBlocks={scheduleBlocks}
      />
    </div>
  );
}
