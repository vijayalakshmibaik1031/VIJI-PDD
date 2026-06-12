import { useMemo, useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { EmptyState, StatusBadge, VisibilityBadge } from '../../components/FacilityUI';
import { CATEGORIES, STATUS } from '../../utils/facility';

export default function AuthorityAll() {
  const { complaints } = useComplaints();
  const [room, setRoom] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filtered = useMemo(() => complaints.filter((item) => {
    const created = new Date(item.createdAt).getTime();
    const from = fromDate ? new Date(fromDate).getTime() : null;
    // toDate is end-of-day inclusive
    const to = toDate ? new Date(toDate).getTime() + 86399999 : null;
    return (
      (!room || item.roomId.toLowerCase().includes(room.toLowerCase())) &&
      (!status || item.status === status) &&
      (!category || item.category === category) &&
      (!from || created >= from) &&
      (!to || created <= to)
    );
  }), [complaints, room, status, category, fromDate, toDate]);

  if (!complaints.length) return <EmptyState text="No complaints available." />;

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {/* Room text filter */}
        <input
          className="rounded border px-2 py-1 text-sm"
          placeholder="Filter by room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />

        {/* Status dropdown */}
        <select className="rounded border px-2 py-1 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.values(STATUS).map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>

        {/* Category dropdown */}
        <select className="rounded border px-2 py-1 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input type="date" className="rounded border px-2 py-1 text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" className="rounded border px-2 py-1 text-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
      </div>

      <div className="space-y-2">
        {!filtered.length ? (
          <EmptyState text="No complaints match filters." />
        ) : (
          filtered.map((item) => {
            const displayName = item.employeeName?.trim() || item.employeeId || 'Unknown';
            const displayId = item.employeeName?.trim() && item.employeeId ? ` (${item.employeeId})` : '';
            return (
              <div className="rounded border bg-white p-3" key={item.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-800">{displayName}{displayId}</p>
                  <StatusBadge status={item.status} />
                  <VisibilityBadge visibility={item.visibility} />
                </div>
                <p className="text-sm text-slate-700">Room {item.roomId} - {item.category}</p>
                <p className="text-sm text-slate-700">{item.description}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
