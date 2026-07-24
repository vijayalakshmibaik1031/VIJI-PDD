import { useMemo, useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { EmptyState, StatusBadge, VisibilityBadge, CardMeta } from '../../components/FacilityUI';
import { CATEGORIES, STATUS, VISIBILITY } from '../../utils/facility';

export default function ManagerAll() {
  const { complaints } = useComplaints();
  const [status, setStatus] = useState('');
  const [room, setRoom] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDay, setFilterDay] = useState('');

  const years = Array.from({ length: 7 }, (_, i) => (2024 + i).toString());
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  const filtered = useMemo(() => {
    return complaints.filter((item) => {
      const itemDate = new Date(item.createdAt || item.created_at);
      const y = itemDate.getFullYear().toString();
      const m = (itemDate.getMonth() + 1).toString();
      const d = itemDate.getDate().toString();

      return (
        (!status || item.status === status) &&
        (!room || item.roomId.includes(room)) &&
        (!category || item.category === category) &&
        (!visibility || item.visibility === visibility) &&
        (!filterYear || y === filterYear) &&
        (!filterMonth || m === filterMonth) &&
        (!filterDay || d === filterDay)
      );
    });
  }, [complaints, status, room, category, visibility, filterYear, filterMonth, filterDay]);

  if (!complaints.length) return <EmptyState text="No complaints in system yet." />;

  return (
    <div>
      <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select
          className="rounded border px-2 py-1 text-sm bg-white"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {Object.values(STATUS).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <input
          className="rounded border px-2 py-1 text-sm"
          placeholder="Filter by room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />

        <select
          className="rounded border px-2 py-1 text-sm bg-white"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="rounded border px-2 py-1 text-sm bg-white"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          <option value="">All Visibility</option>
          {Object.values(VISIBILITY).map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <select
          className="rounded border px-2 py-1 text-sm bg-white"
          value={filterDay}
          onChange={(e) => setFilterDay(e.target.value)}
        >
          <option value="">All Days</option>
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          className="rounded border px-2 py-1 text-sm bg-white"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        >
          <option value="">All Months</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          className="rounded border px-2 py-1 text-sm bg-white"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        >
          <option value="">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {!filtered.length ? (
          <EmptyState text="No complaints match selected filters." />
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`rounded border bg-white p-3 ${
                item.status === 'escalated' ? 'border-purple-300 bg-purple-50' : ''
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-slate-800">
                  {item.employeeName} ({item.employeeId})
                </p>
                <StatusBadge status={item.status} />
                <VisibilityBadge visibility={item.visibility} />
                {item.status === 'escalated' && (
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    Escalated to Authority
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700">
                Room {item.roomId} - {item.category}
              </p>
              <p className="text-sm text-slate-700">{item.description}</p>
              <CardMeta createdAt={item.createdAt} />

              {/* Show rejection history count */}
              {item.rejectionHistory?.length > 0 && (
                <p className="mt-1 text-xs text-red-600">
                  {item.rejectionHistory.length} rejection{item.rejectionHistory.length !== 1 ? 's' : ''}
                </p>
              )}

              {/* Show escalation reason */}
              {item.status === 'escalated' && item.escalationDescription && (
                <div className="mt-1 rounded border border-purple-200 bg-white px-2 py-1 text-xs text-purple-700">
                  Escalation reason: {item.escalationDescription}
                </div>
              )}

              {/* Show rejection reason for rejected complaints */}
              {item.status === 'rejected' && item.rejectionReason && (
                <div className="mt-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
                  Rejection reason: {item.rejectionReason}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
