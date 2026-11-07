import React, { useState } from 'react';
import { Building2, Printer, Download, MapPin, Layers, Users, Clock } from 'lucide-react';
import TimetableGrid from './TimetableGrid';
import { exportToCSV } from '../utils/exporter';

export default function RoomView({
  rooms = [],
  subjects = [],
  teachers = [],
  sections = [],
  blocks = [],
  conflicts = {},
  asynchronousDays = ['Wednesday']
}) {
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || '');
  const [roomFilterType, setRoomFilterType] = useState('ALL');

  const filteredDropdownRooms = rooms.filter(r => {
    if (roomFilterType === 'ALL') return true;
    if (roomFilterType === 'Lecture') return r.type === 'Lecture' || r.type === 'Lecture & Laboratory' || r.type === 'Both';
    if (roomFilterType === 'Laboratory') return r.type === 'Laboratory' || r.type === 'Lecture & Laboratory' || r.type === 'Both';
    if (roomFilterType === 'Lecture & Laboratory') return r.type === 'Lecture & Laboratory' || r.type === 'Both';
    if (roomFilterType === 'AVR') return r.type === 'AVR';
    return true;
  });

  const currentRoom = rooms.find(r => r.id === selectedRoomId) || filteredDropdownRooms[0] || rooms[0];

  const roomBlocks = blocks.filter(b => b.roomId === currentRoom?.id);

  // Calculate total room utilization hours per week
  const totalOccupiedMinutes = roomBlocks.reduce((acc, b) => {
    const [h1, m1] = b.startTime.split(':').map(Number);
    const [h2, m2] = b.endTime.split(':').map(Number);
    return acc + (h2 * 60 + m2 - (h1 * 60 + m1));
  }, 0);

  const totalOccupiedHours = (totalOccupiedMinutes / 60).toFixed(1);
  const utilizationPercentage = Math.min(100, Math.round((totalOccupiedHours / 60) * 100));

  const handleExportCSV = () => {
    if (!currentRoom) return;
    const rows = roomBlocks.map(b => {
      const sub = subjects.find(s => s.id === b.subjectId);
      const teacher = teachers.find(t => t.id === b.teacherId);
      const sec = sections.find(s => s.id === b.sectionId);
      return {
        Day: b.day,
        StartTime: b.startTime,
        EndTime: b.endTime,
        RoomName: currentRoom.name,
        RoomType: currentRoom.type,
        SubjectCode: sub?.code || '',
        SubjectName: sub?.name || '',
        Section: sec?.code || '',
        Instructor: teacher?.name || ''
      };
    });
    exportToCSV(`room_utilization_${currentRoom.name.replace(/\s+/g, '_')}.csv`, rows);
  };

  return (
    <div className="space-y-6 font-poppins">
      {/* Header Banner */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xl no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-amber-400 flex items-center justify-center font-bold">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-emerald-950">Room Schedule & Utilization Portal</h1>
              <p className="text-xs text-slate-500 font-medium">
                Track room occupancy, lab vs lecture room allocations, & download room schedules
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Filter Designation
              </label>
              <select
                value={roomFilterType}
                onChange={e => {
                  setRoomFilterType(e.target.value);
                  const matching = rooms.filter(r => {
                    if (e.target.value === 'ALL') return true;
                    if (e.target.value === 'Lecture') return r.type === 'Lecture' || r.type === 'Lecture & Laboratory' || r.type === 'Both';
                    if (e.target.value === 'Laboratory') return r.type === 'Laboratory' || r.type === 'Lecture & Laboratory' || r.type === 'Both';
                    if (e.target.value === 'Lecture & Laboratory') return r.type === 'Lecture & Laboratory' || r.type === 'Both';
                    if (e.target.value === 'AVR') return r.type === 'AVR';
                    return true;
                  });
                  if (matching.length > 0 && !matching.some(m => m.id === selectedRoomId)) {
                    setSelectedRoomId(matching[0].id);
                  }
                }}
                className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="ALL">All Room Types ({rooms.length})</option>
                <option value="Lecture">🏫 Lecture Rooms</option>
                <option value="Laboratory">🧪 Laboratory Rooms</option>
                <option value="Lecture & Laboratory">⭐ Lecture & Laboratory</option>
                <option value="AVR">📽️ AVR / Hall</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Select Room ({filteredDropdownRooms.length})
              </label>
              <select
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                {filteredDropdownRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} - {r.type} (Cap: {r.capacity})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all shadow-sm"
            >
              <Download className="w-4 h-4 mr-1.5 text-emerald-700" />
              Export CSV
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md transition-all"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Room Schedule
            </button>
          </div>
        </div>

        {/* Room Info Cards */}
        {currentRoom && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
              <span className="text-xs text-slate-500 font-medium">Building / Location</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{currentRoom.building}</div>
            </div>
            <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
              <span className="text-xs text-slate-500 font-medium">Room Designation</span>
              <div className="text-sm font-bold text-emerald-900 mt-0.5">{currentRoom.type}</div>
            </div>
            <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
              <span className="text-xs text-slate-500 font-medium">Seating Capacity</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{currentRoom.capacity} Seats</div>
            </div>
            <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
              <span className="text-xs text-slate-500 font-medium">Weekly Occupancy</span>
              <div className="text-sm font-bold text-emerald-800 mt-0.5">
                {totalOccupiedHours} hrs / week ({utilizationPercentage}%)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timetable Grid View */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-emerald-950 flex items-center px-1">
          <Clock className="w-5 h-5 mr-2 text-emerald-700" />
          Weekly Occupancy Timetable for {currentRoom?.name}
        </h2>
        <TimetableGrid
          blocks={blocks}
          subjects={subjects}
          teachers={teachers}
          rooms={rooms}
          sections={sections}
          conflicts={conflicts}
          asynchronousDays={asynchronousDays}
          viewMode="room"
          filterId={selectedRoomId}
        />
      </div>
    </div>
  );
}
