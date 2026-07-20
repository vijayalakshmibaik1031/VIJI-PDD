import { useState, useEffect } from 'react';
import { formatRelativeTime } from '../utils/facility';
import { useComplaints } from '../context/ComplaintContext';

function useRelativeTime(isoString) {
  const [time, setTime] = useState(formatRelativeTime(isoString));

  useEffect(() => {
    const updateTime = () => {
      setTime(formatRelativeTime(isoString));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [isoString]);

  return time;
}

export function VisibilityBadge({ visibility }) {
  const v = visibility || 'private';
  const map = {
    private: 'bg-amber-100 text-amber-700',
    public: 'bg-teal-100 text-teal-700',
  };
  return <span className={`rounded-full px-2 py-1 text-xs ${map[v] || 'bg-slate-100 text-slate-600'}`}>{v}</span>;
}

export function StatusBadge({ status }) {
  const s = status || 'pending';
  const map = {
    pending: 'bg-slate-200 text-slate-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    merged_public: 'bg-teal-100 text-teal-700',
    escalated: 'bg-purple-100 text-purple-700',
    acknowledged: 'bg-blue-100 text-blue-700',
  };
  const label = s === 'acknowledged' ? 'in progress' : s.replace(/_/g, ' ');
  return <span className={`rounded-full px-2 py-1 text-xs ${map[s] || map.pending}`}>{label}</span>;
}

export function EmptyState({ text }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 w-full">
      <div className="mb-2 text-3xl">📭</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function CardMeta({ createdAt }) {
  const time = useRelativeTime(createdAt);
  return <span className="text-xs text-slate-500">{time}</span>;
}

export function RoomPicker({ selected, onSelect }) {
  const { rooms } = useComplaints();
  const [activeFloor, setActiveFloor] = useState(null);

  // Group rooms by floor_number
  const groups = {};
  rooms.forEach((room) => {
    const floor = room.floor_number || '1';
    if (!groups[floor]) {
      groups[floor] = [];
    }
    groups[floor].push(room.room_number);
  });

  const sortedFloors = Object.keys(groups).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  // Auto-set the active floor to the selected room's floor
  useEffect(() => {
    if (selected) {
      const foundRoom = rooms.find((r) => r.room_number === selected);
      if (foundRoom && foundRoom.floor_number) {
        setActiveFloor(foundRoom.floor_number);
      }
    }
  }, [selected, rooms]);

  if (rooms.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic p-2 border rounded bg-slate-50">
        No rooms configured. Contact Authority.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Floor Buttons Grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {sortedFloors.map((floor) => (
          <button
            key={floor}
            type="button"
            onClick={() => setActiveFloor(activeFloor === floor ? null : floor)}
            className={`rounded-lg border p-3 text-center transition-all duration-300 ${
              activeFloor === floor
                ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-md scale-102'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            🏢 Floor {floor}
          </button>
        ))}
      </div>

      {/* Accordion drawers for rooms on each floor */}
      {sortedFloors.map((floor) => {
        const isOpen = activeFloor === floor;
        return (
          <div
            key={floor}
            style={{
              maxHeight: isOpen ? '500px' : '0px',
              opacity: isOpen ? 1 : 0,
              visibility: isOpen ? 'visible' : 'hidden',
              padding: isOpen ? '12px' : '0px',
              borderWidth: isOpen ? '1px' : '0px',
              marginTop: isOpen ? '8px' : '0px',
            }}
            className="transition-all duration-300 ease-in-out overflow-hidden rounded-lg border-slate-200 bg-slate-50"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Rooms on Floor {floor}
            </p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {groups[floor].map((roomId) => (
                <button
                  key={roomId}
                  type="button"
                  onClick={() => onSelect(roomId)}
                  className={`rounded border p-2 text-sm transition-all duration-200 hover:border-slate-400 ${
                    selected === roomId
                      ? 'border-blue-600 bg-blue-100 text-blue-700 font-semibold shadow-sm'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {roomId}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

