export const DEFAULT_TEACHERS = [
  {
    id: 'prof-1',
    name: 'Engr. Juan Dela Cruz',
    department: 'College of Computer Studies',
    employmentType: 'Permanent',
    maxUnits: 24,
    maxHours: 30,
    assignedSubjectIds: ['sub-1', 'sub-2'],
    assignedSectionSubjectPairs: [
      { subjectId: 'sub-1', sectionId: 'sec-1' } // Engr. Dela Cruz assigned to CC 101 for BSCS 1-A
    ],
    availability: {
      Monday: { 't-730': 'preferred', 't-830': 'preferred', 't-930': 'preferred', 't-1030': 'preferred', 't-1130': 'available', 't-100': 'available', 't-200': 'available' },
      Tuesday: { 't-730': 'preferred', 't-830': 'preferred', 't-930': 'preferred', 't-1030': 'preferred', 't-100': 'available', 't-200': 'available' },
      Wednesday: { 't-730': 'preferred', 't-830': 'preferred', 't-930': 'preferred', 't-1030': 'preferred', 't-100': 'available', 't-200': 'available' },
      Thursday: { 't-730': 'preferred', 't-830': 'preferred', 't-930': 'preferred', 't-1030': 'preferred', 't-100': 'available' },
      Friday: { 't-730': 'preferred', 't-830': 'preferred', 't-930': 'preferred', 't-1030': 'preferred' },
      Saturday: { 't-730': 'available', 't-830': 'available', 't-930': 'available' }
    },
    notes: 'Prefers morning classes for Computer Programming.'
  },
  {
    id: 'prof-2',
    name: 'Dr. Maria Santos',
    department: 'College of Computer Studies',
    employmentType: 'Permanent',
    maxUnits: 24,
    maxHours: 30,
    assignedSubjectIds: ['sub-3', 'sub-4'],
    assignedSectionSubjectPairs: [
      { subjectId: 'sub-4', sectionId: 'sec-1' } // Dr. Santos assigned to GE 101 for BSCS 1-A
    ],
    availability: {
      Monday: { 't-930': 'preferred', 't-1030': 'preferred', 't-1130': 'preferred', 't-100': 'preferred', 't-200': 'preferred' },
      Tuesday: { 't-930': 'preferred', 't-1030': 'preferred', 't-1130': 'preferred', 't-100': 'preferred', 't-200': 'preferred' },
      Wednesday: { 't-930': 'preferred', 't-1030': 'preferred', 't-1130': 'preferred', 't-100': 'preferred' },
      Thursday: { 't-930': 'preferred', 't-1030': 'preferred', 't-1130': 'preferred', 't-100': 'preferred' },
      Friday: { 't-930': 'preferred', 't-1030': 'preferred', 't-1130': 'preferred' },
      Saturday: { 't-730': 'unavailable', 't-830': 'unavailable' }
    },
    notes: 'Available strictly after 9:30 AM due to research loads.'
  },
  {
    id: 'prof-3',
    name: 'Prof. Mark Reyes',
    department: 'College of Engineering',
    employmentType: 'COS',
    maxUnits: 24,
    maxHours: 30,
    assignedSubjectIds: ['sub-1', 'sub-5'],
    assignedSectionSubjectPairs: [
      { subjectId: 'sub-1', sectionId: 'sec-2' } // Prof. Reyes assigned to CC 101 for BSIT 1-A
    ],
    availability: {
      Monday: { 't-730': 'available', 't-830': 'available', 't-930': 'available', 't-100': 'available', 't-200': 'available' },
      Tuesday: { 't-730': 'available', 't-830': 'available', 't-930': 'available', 't-100': 'available', 't-200': 'available' },
      Wednesday: { 't-730': 'available', 't-830': 'available', 't-930': 'available', 't-100': 'available' },
      Thursday: { 't-730': 'available', 't-830': 'available', 't-930': 'available', 't-100': 'available' },
      Friday: { 't-730': 'available', 't-830': 'available', 't-930': 'available' },
      Saturday: { 't-730': 'preferred', 't-830': 'preferred', 't-930': 'preferred' }
    },
    notes: 'Expert in Web Development and Database Management Systems.'
  }
];

export const DEFAULT_ROOMS = [
  {
    id: 'room-1',
    name: 'CLAB 301 (Comp Lab 1)',
    building: 'IT Building - 3rd Floor',
    type: 'Laboratory',
    capacity: 45,
    equipment: '45 High-Spec PCs, Aircon, Projector'
  },
  {
    id: 'room-2',
    name: 'CLAB 302 (Comp Lab 2)',
    building: 'IT Building - 3rd Floor',
    type: 'Laboratory',
    capacity: 40,
    equipment: '40 Workstations, Smartboard, Aircon'
  },
  {
    id: 'room-3',
    name: 'LEC 201',
    building: 'Main Academic Building - 2nd Floor',
    type: 'Lecture',
    capacity: 55,
    equipment: 'Whiteboard, Audio System, Projector'
  },
  {
    id: 'room-4',
    name: 'LEC 202',
    building: 'Main Academic Building - 2nd Floor',
    type: 'Lecture',
    capacity: 50,
    equipment: 'Whiteboard, Aircon'
  },
  {
    id: 'room-5',
    name: 'AVR Hall 1',
    building: 'Library Building - 4th Floor',
    type: 'AVR',
    capacity: 100,
    equipment: 'Stage, Sound System, Dual Projectors'
  },
  {
    id: 'room-6',
    name: 'MPR 101 (Multi-Purpose Lec & Lab)',
    building: 'CS Building - 1st Floor',
    type: 'Lecture & Laboratory',
    capacity: 50,
    equipment: '30 Laptops, Whiteboard, Projector'
  }
];

export const DEFAULT_SUBJECTS = [
  {
    id: 'sub-1',
    code: 'CC 101',
    name: 'Computer Programming 1 (Python)',
    department: 'College of Computer Studies',
    semester: '1st Semester',
    yearLevel: 1,
    units: 3,
    totalHours: 5,
    lecHours: 2,
    labHours: 3,
    defaultLecRoomId: 'room-3', // LEC 201
    defaultLabRoomId: 'room-1', // CLAB 301
    allowedLecRoomIds: ['room-3', 'room-4', 'room-6'],
    allowedLabRoomIds: ['room-1', 'room-2', 'room-6'],
    color: '#3b82f6'
  },
  {
    id: 'sub-2',
    code: 'CC 102',
    name: 'Data Structures and Algorithms',
    department: 'College of Computer Studies',
    semester: '2nd Semester',
    yearLevel: 1,
    units: 3,
    totalHours: 5,
    lecHours: 2,
    labHours: 3,
    defaultLecRoomId: 'room-3', // LEC 201
    defaultLabRoomId: 'room-2', // CLAB 302
    allowedLecRoomIds: ['room-3', 'room-4', 'room-6'],
    allowedLabRoomIds: ['room-1', 'room-2', 'room-6'],
    color: '#8b5cf6'
  },
  {
    id: 'sub-3',
    code: 'IT 201',
    name: 'Database Management Systems',
    department: 'College of Computer Studies',
    semester: '1st Semester',
    yearLevel: 2,
    units: 3,
    totalHours: 5,
    lecHours: 2,
    labHours: 3,
    defaultLecRoomId: 'room-4', // LEC 202
    defaultLabRoomId: 'room-1', // CLAB 301
    allowedLecRoomIds: ['room-4', 'room-3'],
    allowedLabRoomIds: ['room-1', 'room-6'],
    color: '#10b981'
  },
  {
    id: 'sub-4',
    code: 'GE 101',
    name: 'Understanding the Self',
    department: 'General Education',
    semester: '1st Semester',
    yearLevel: 1,
    units: 3,
    totalHours: 3,
    lecHours: 3,
    labHours: 0,
    defaultLecRoomId: 'room-4', // LEC 202
    defaultLabRoomId: '',
    allowedLecRoomIds: ['room-3', 'room-4', 'room-5', 'room-6'],
    allowedLabRoomIds: [],
    color: '#f59e0b'
  },
  {
    id: 'sub-5',
    code: 'IT 302',
    name: 'Web Application Development',
    department: 'College of Computer Studies',
    semester: '2nd Semester',
    yearLevel: 3,
    units: 3,
    totalHours: 5,
    lecHours: 2,
    labHours: 3,
    defaultLecRoomId: 'room-3', // LEC 201
    defaultLabRoomId: 'room-2', // CLAB 302
    allowedLecRoomIds: ['room-3', 'room-6'],
    allowedLabRoomIds: ['room-1', 'room-2', 'room-6'],
    color: '#ec4899'
  }
];

export const DEFAULT_SECTIONS = [
  {
    id: 'sec-1',
    code: 'BSCS 1-A',
    program: 'BS Computer Science',
    yearLevel: 1,
    semester: '1st Semester',
    studentCount: 42
  },
  {
    id: 'sec-2',
    code: 'BSIT 1-A',
    program: 'BS Information Technology',
    yearLevel: 1,
    semester: '1st Semester',
    studentCount: 45
  },
  {
    id: 'sec-3',
    code: 'BSCS 2-A',
    program: 'BS Computer Science',
    yearLevel: 2,
    semester: '1st Semester',
    studentCount: 38
  }
];

export const DEFAULT_SCHEDULE_BLOCKS = [
  {
    id: 'block-1',
    sectionId: 'sec-1',
    subjectId: 'sub-1',
    teacherId: 'prof-1',
    roomId: 'room-3',
    day: 'Monday',
    startTime: '07:30',
    endTime: '08:30',
    type: 'Lecture',
    deliveryMode: 'Face-to-Face',
    semester: '1st Semester',
    notes: 'Face-to-Face Lecture (1 hr)'
  },
  {
    id: 'block-1-asynch',
    sectionId: 'sec-1',
    subjectId: 'sub-1',
    teacherId: 'prof-1',
    roomId: null,
    day: 'Wednesday',
    startTime: '07:30',
    endTime: '08:30',
    type: 'Lecture',
    deliveryMode: 'Asynchronous',
    semester: '1st Semester',
    notes: 'Designated Asynchronous Lecture (1 hr)'
  },
  {
    id: 'block-2',
    sectionId: 'sec-1',
    subjectId: 'sub-1',
    teacherId: 'prof-1',
    roomId: 'room-1',
    day: 'Friday',
    startTime: '07:30',
    endTime: '10:30',
    type: 'Laboratory',
    deliveryMode: 'Face-to-Face',
    semester: '1st Semester',
    notes: 'Hands-on Lab Session (3 hrs)'
  },
  {
    id: 'block-3',
    sectionId: 'sec-1',
    subjectId: 'sub-4',
    teacherId: 'prof-2',
    roomId: 'room-4',
    day: 'Tuesday',
    startTime: '09:30',
    endTime: '12:30',
    type: 'Lecture',
    deliveryMode: 'Face-to-Face',
    semester: '1st Semester',
    notes: 'GE Lecture (3 hrs)'
  },
  {
    id: 'block-4',
    sectionId: 'sec-2',
    subjectId: 'sub-1',
    teacherId: 'prof-3',
    roomId: 'room-3',
    day: 'Monday',
    startTime: '13:00',
    endTime: '14:00',
    type: 'Lecture',
    deliveryMode: 'Face-to-Face',
    semester: '1st Semester',
    notes: 'Face-to-Face Lecture (1 hr)'
  },
  {
    id: 'block-4-asynch',
    sectionId: 'sec-2',
    subjectId: 'sub-1',
    teacherId: 'prof-3',
    roomId: null,
    day: 'Wednesday',
    startTime: '13:00',
    endTime: '14:00',
    type: 'Lecture',
    deliveryMode: 'Asynchronous',
    semester: '1st Semester',
    notes: 'Designated Asynchronous Lecture (1 hr)'
  },
  {
    id: 'block-5',
    sectionId: 'sec-2',
    subjectId: 'sub-1',
    teacherId: 'prof-3',
    roomId: 'room-2',
    day: 'Thursday',
    startTime: '13:00',
    endTime: '16:00',
    type: 'Laboratory',
    deliveryMode: 'Face-to-Face',
    semester: '1st Semester',
    notes: 'Programming Lab'
  }
];

export const DEFAULT_PROGRAMS = [
  { id: 'prog-1', code: 'BSCS', name: 'BS Computer Science', department: 'College of Computer Studies' },
  { id: 'prog-2', code: 'BSIT', name: 'BS Information Technology', department: 'College of Computer Studies' },
  { id: 'prog-3', code: 'BSABE', name: 'BS Agricultural & Biosystems Engineering', department: 'College of Engineering' },
  { id: 'prog-4', code: 'BSA', name: 'BS Agriculture', department: 'College of Agriculture' },
  { id: 'prog-5', code: 'BSFT', name: 'BS Food Technology', department: 'College of Agriculture' }
];

export const DEFAULT_SIGNATORIES = [
  { id: 'sig-1', label: 'Prepared by:', name: 'VERONICA LOUISE L. PIANDO', title: 'Program Chairperson' },
  { id: 'sig-2', label: 'Recommending Approval:', name: 'GINEO B. JUEGO', title: 'Dean' },
  { id: 'sig-3', label: 'Approved by:', name: 'ROWEL M. CASTUERA', title: 'Campus Administrator' },
  { id: 'sig-4', label: 'Attested by:', name: 'EMERSON L. BERGONIO, PhD', title: 'VPAA' },
  { id: 'sig-5', label: 'SUC President:', name: 'ALBERTO N. NAPERI, DPA', title: 'SUC President IV' }
];

export const DEFAULT_TEMPLATE_SETTINGS = {
  collegeName: 'COLLEGE OF INFORMATION TECHNOLOGY',
  documentCode: 'CIT-FR-001',
  effectivityDate: 'June 3, 2024',
  revisionNo: '2',
  schoolYear: 'SY 2024 – 2025',
  asynchronousDays: ['Wednesday']
};
