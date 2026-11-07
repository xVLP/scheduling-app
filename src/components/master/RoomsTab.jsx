import React, { useState } from 'react';
import { Building2, Search, X, Edit3, Trash2, RotateCcw } from 'lucide-react';

export default function RoomsTab({ rooms = [], onEdit, onDelete }) {
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('ALL');
  const [roomBuildingFilter, setRoomBuildingFilter] = useState('ALL');

  const uniqueBuildings = Array.from(new Set(rooms.map(r => r.building).filter(Boolean)));

  const filteredMasterRooms = rooms.filter(room => {
    const query = roomSearchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      room.name.toLowerCase().includes(query) || 
      (room.building && room.building.toLowerCase().includes(query));

    let matchesType = true;
    if (roomTypeFilter !== 'ALL') {
      if (roomTypeFilter === 'Lecture') {
        matchesType = room.type === 'Lecture' || room.type === 'Lecture & Laboratory' || room.type === 'Both';
      } else if (roomTypeFilter === 'Laboratory') {
        matchesType = room.type === 'Laboratory' || room.type === 'Lecture & Laboratory' || room.type === 'Both';
      } else {
        matchesType = room.type === roomTypeFilter;
      }
    }

    const matchesBuilding = roomBuildingFilter === 'ALL' || room.building === roomBuildingFilter;
    return matchesQuery && matchesType && matchesBuilding;
  });

  const handleResetFilters = () => {
    setRoomSearchQuery('');
    setRoomTypeFilter('ALL');
    setRoomBuildingFilter('ALL');
  };

  const isFiltering = roomSearchQuery || roomTypeFilter !== 'ALL' || roomBuildingFilter !== 'ALL';

  return (
    <div className="space-y-6">
      {/* ROOMS FILTER BAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={roomSearchQuery}
              onChange={e => setRoomSearchQuery(e.target.value)}
              placeholder="Search rooms by name or building location..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {roomSearchQuery && (
              <button
                onClick={() => setRoomSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Building Location Filter */}
          {uniqueBuildings.length > 0 && (
            <div className="shrink-0">
              <select
                value={roomBuildingFilter}
                onChange={e => setRoomBuildingFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="ALL">🏢 All Buildings ({uniqueBuildings.length})</option>
                {uniqueBuildings.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Designation Type Filter Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2">
            <label className="text-[11px] font-bold text-slate-600">Filter Room Designation:</label>
            <select
              value={roomTypeFilter}
              onChange={e => setRoomTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-1.5 font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value="ALL">🏫 All Room Types ({rooms.length})</option>
              <option value="Lecture">🏫 Lecture Rooms</option>
              <option value="Laboratory">🧪 Laboratory Rooms</option>
              <option value="Lecture & Laboratory">⭐ Multipurpose (Lec & Lab)</option>
              <option value="AVR">📽️ AVR / Hall</option>
            </select>
          </div>

          {/* Filter Count Summary & Reset */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">
              Showing <strong className="text-slate-900 font-bold">{filteredMasterRooms.length}</strong> of {rooms.length} rooms
            </span>

            {isFiltering && (
              <button
                onClick={handleResetFilters}
                className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center space-x-1 ml-2 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all hover:bg-emerald-100"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ROOMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMasterRooms.length === 0 && (
          <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-2">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No rooms match your filter criteria</h3>
            <p className="text-xs text-slate-500">Try adjusting your search keyword or changing the designation filter.</p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all"
            >
              Clear Room Filters
            </button>
          </div>
        )}

        {filteredMasterRooms.map(room => (
          <div
            key={room.id}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{room.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{room.building}</p>
                </div>
                <span
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider shrink-0 ${
                    room.type === 'Laboratory'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : room.type === 'Lecture & Laboratory' || room.type === 'Both'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : room.type === 'AVR'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {room.type || 'Lecture & Laboratory'}
                </span>
              </div>
              <div className="mt-4 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-700 font-medium">
                <span>Seating Capacity:</span>{' '}
                <strong className="text-emerald-900 font-bold ml-1">{room.capacity ? `${room.capacity} Students` : 'Flexible / N/A'}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-1 mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => onEdit(room)}
                className="p-2 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all"
                title="Edit Room"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(room.id)}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                title="Delete Room"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
