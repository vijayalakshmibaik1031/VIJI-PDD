import { useState, useEffect } from 'react';
import { ROOM_IDS, formatRelativeTime } from '../utils/facility';

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
    acknowledged: 'bg-indigo-100 text-indigo-700',
  };
  return <span className={`rounded-full px-2 py-1 text-xs ${map[s] || map.pending}`}>{s.replace(/_/g, ' ')}</span>;
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
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
      {ROOM_IDS.map((roomId) => (
        <button
          key={roomId}
          type="button"
          onClick={() => onSelect(roomId)}
          className={`rounded border p-2 text-sm ${
            selected === roomId
              ? 'border-blue-600 bg-blue-100 text-blue-700'
              : 'border-slate-300 bg-white text-slate-700'
          }`}
        >
          {roomId}
        </button>
      ))}
    </div>
  );
}

