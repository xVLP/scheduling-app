import {
  DEFAULT_TEACHERS,
  DEFAULT_ROOMS,
  DEFAULT_SUBJECTS,
  DEFAULT_SECTIONS,
  DEFAULT_SCHEDULE_BLOCKS,
  DEFAULT_PROGRAMS,
  DEFAULT_SIGNATORIES,
  DEFAULT_TEMPLATE_SETTINGS
} from './initialData';

export const STORAGE_KEYS = {
  TEACHERS: 'acad_sched_teachers_v1',
  ROOMS: 'acad_sched_rooms_v1',
  SUBJECTS: 'acad_sched_subjects_v1',
  SECTIONS: 'acad_sched_sections_v1',
  SCHEDULE_BLOCKS: 'acad_sched_blocks_v1',
  PROGRAMS: 'acad_sched_programs_v1',
  SIGNATORIES: 'acad_sched_signatories_v1',
  TEMPLATE_SETTINGS: 'acad_sched_template_settings_v1',
  ACTIVE_TAB: 'acad_sched_active_tab_v1',
  SELECTED_SEMESTER: 'acad_sched_selected_semester_v1',
  SELECTED_YEAR: 'acad_sched_selected_year_v1',
  LAST_SAVED: 'acad_sched_last_saved_v1'
};

export const loadData = () => {
  try {
    const teachers = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    const rooms = localStorage.getItem(STORAGE_KEYS.ROOMS);
    const subjects = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    const sections = localStorage.getItem(STORAGE_KEYS.SECTIONS);
    const blocks = localStorage.getItem(STORAGE_KEYS.SCHEDULE_BLOCKS);
    const programs = localStorage.getItem(STORAGE_KEYS.PROGRAMS);
    const signatories = localStorage.getItem(STORAGE_KEYS.SIGNATORIES);
    const templateSettings = localStorage.getItem(STORAGE_KEYS.TEMPLATE_SETTINGS);
    const activeTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
    const selectedSemester = localStorage.getItem(STORAGE_KEYS.SELECTED_SEMESTER);
    const selectedYearLevel = localStorage.getItem(STORAGE_KEYS.SELECTED_YEAR);
    const lastSaved = localStorage.getItem(STORAGE_KEYS.LAST_SAVED);

    // Remove any virtual online room from physical rooms list
    let parsedRooms = rooms ? JSON.parse(rooms) : DEFAULT_ROOMS;
    if (parsedRooms.some(r => r.id === 'room-online')) {
      parsedRooms = parsedRooms.filter(r => r.id !== 'room-online');
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(parsedRooms));
    }

    // Check if blocks have the old unsplit default block-1 (07:30 to 09:30) or assigned room-online
    let parsedBlocks = blocks ? JSON.parse(blocks) : DEFAULT_SCHEDULE_BLOCKS;
    let blocksModified = false;
    if (parsedBlocks.some(b => b.id === 'block-1' && b.startTime === '07:30' && b.endTime === '09:30')) {
      parsedBlocks = DEFAULT_SCHEDULE_BLOCKS;
      blocksModified = true;
    }

    // Ensure all asynchronous blocks have NO room (roomId: null)
    parsedBlocks = parsedBlocks.map(b => {
      if (b.deliveryMode === 'Asynchronous' || b.roomId === 'room-online') {
        if (b.roomId !== null) {
          blocksModified = true;
          return { ...b, roomId: null };
        }
      }
      return b;
    });

    if (blocksModified) {
      localStorage.setItem(STORAGE_KEYS.SCHEDULE_BLOCKS, JSON.stringify(parsedBlocks));
    }

    const data = {
      teachers: teachers ? JSON.parse(teachers) : DEFAULT_TEACHERS,
      rooms: parsedRooms,
      subjects: subjects ? JSON.parse(subjects) : DEFAULT_SUBJECTS,
      sections: sections ? JSON.parse(sections) : DEFAULT_SECTIONS,
      scheduleBlocks: parsedBlocks,
      programs: programs ? JSON.parse(programs) : DEFAULT_PROGRAMS,
      signatories: signatories ? JSON.parse(signatories) : DEFAULT_SIGNATORIES,
      templateSettings: (() => {
        const parsed = templateSettings ? JSON.parse(templateSettings) : { ...DEFAULT_TEMPLATE_SETTINGS };
        if (!parsed.asynchronousDays) {
          parsed.asynchronousDays = DEFAULT_TEMPLATE_SETTINGS.asynchronousDays || ['Wednesday'];
        }
        return parsed;
      })(),
      activeTab: activeTab || 'dean',
      selectedSemester: selectedSemester || '1st Semester',
      selectedYearLevel: selectedYearLevel || 'ALL',
      lastSaved: lastSaved || null
    };

    // If localStorage was empty on initial run, seed it so it persists immediately
    if (!teachers) localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(DEFAULT_TEACHERS));
    if (!rooms) localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(DEFAULT_ROOMS));
    if (!subjects) localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
    if (!sections) localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(DEFAULT_SECTIONS));
    if (!blocks) localStorage.setItem(STORAGE_KEYS.SCHEDULE_BLOCKS, JSON.stringify(DEFAULT_SCHEDULE_BLOCKS));
    if (!programs) localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(DEFAULT_PROGRAMS));
    if (!signatories) localStorage.setItem(STORAGE_KEYS.SIGNATORIES, JSON.stringify(DEFAULT_SIGNATORIES));
    if (!templateSettings) localStorage.setItem(STORAGE_KEYS.TEMPLATE_SETTINGS, JSON.stringify(DEFAULT_TEMPLATE_SETTINGS));

    return data;
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    return {
      teachers: DEFAULT_TEACHERS,
      rooms: DEFAULT_ROOMS,
      subjects: DEFAULT_SUBJECTS,
      sections: DEFAULT_SECTIONS,
      scheduleBlocks: DEFAULT_SCHEDULE_BLOCKS,
      programs: DEFAULT_PROGRAMS,
      signatories: DEFAULT_SIGNATORIES,
      templateSettings: DEFAULT_TEMPLATE_SETTINGS,
      activeTab: 'dean',
      selectedSemester: '1st Semester',
      selectedYearLevel: 'ALL',
      lastSaved: null
    };
  }
};

export const saveData = (key, data) => {
  try {
    if (STORAGE_KEYS[key]) {
      localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED, now);
      return now;
    }
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
  }
  return null;
};

export const saveUIPreference = (key, value) => {
  try {
    if (STORAGE_KEYS[key]) {
      localStorage.setItem(STORAGE_KEYS[key], String(value));
    }
  } catch (error) {
    console.error(`Failed to save UI preference ${key}:`, error);
  }
};

export const resetToDemoData = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(DEFAULT_TEACHERS));
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(DEFAULT_ROOMS));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
    localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(DEFAULT_SECTIONS));
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_BLOCKS, JSON.stringify(DEFAULT_SCHEDULE_BLOCKS));
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(DEFAULT_PROGRAMS));
    localStorage.setItem(STORAGE_KEYS.SIGNATORIES, JSON.stringify(DEFAULT_SIGNATORIES));
    localStorage.setItem(STORAGE_KEYS.TEMPLATE_SETTINGS, JSON.stringify(DEFAULT_TEMPLATE_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
    return {
      teachers: DEFAULT_TEACHERS,
      rooms: DEFAULT_ROOMS,
      subjects: DEFAULT_SUBJECTS,
      sections: DEFAULT_SECTIONS,
      scheduleBlocks: DEFAULT_SCHEDULE_BLOCKS,
      programs: DEFAULT_PROGRAMS,
      signatories: DEFAULT_SIGNATORIES,
      templateSettings: DEFAULT_TEMPLATE_SETTINGS
    };
  } catch (error) {
    console.error('Error resetting demo data:', error);
    return null;
  }
};

export const exportDataAsJSON = () => {
  const data = loadData();
  const exportPayload = {
    appName: "CBSUA College Scheduling System",
    exportedAt: new Date().toISOString(),
    teachers: data.teachers,
    rooms: data.rooms,
    subjects: data.subjects,
    sections: data.sections,
    scheduleBlocks: data.scheduleBlocks,
    programs: data.programs,
    signatories: data.signatories,
    templateSettings: data.templateSettings
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `cbsua_schedule_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
