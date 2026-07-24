import { useMemo, useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { EmptyState, StatusBadge, VisibilityBadge, CardMeta } from '../../components/FacilityUI';
import { CATEGORIES, STATUS, formatRelativeTime } from '../../utils/facility';

export default function AuthorityAll() {
  const { complaints, mergedGroups } = useComplaints();
  const [room, setRoom] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
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

  const filtered = useMemo(() => complaints.filter((item) => {
    const itemDate = new Date(item.createdAt || item.created_at);
    const y = itemDate.getFullYear().toString();
    const m = (itemDate.getMonth() + 1).toString();
    const d = itemDate.getDate().toString();

    return (
      (!room || item.roomId.toLowerCase().includes(room.toLowerCase())) &&
      (!status || item.status === status) &&
      (!category || item.category === category) &&
      (!filterYear || y === filterYear) &&
      (!filterMonth || m === filterMonth) &&
      (!filterDay || d === filterDay)
    );
  }), [complaints, room, status, category, filterYear, filterMonth, filterDay]);

  if (!complaints.length) return <EmptyState text="No complaints available." />;

  return (
    <div>
      <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {/* Room text filter */}
        <input
          className="rounded border px-2 py-1 text-sm"
          placeholder="Filter by room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />

        {/* Status dropdown */}
        <select className="rounded border px-2 py-1 text-sm bg-white" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.values(STATUS).map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>

        {/* Category dropdown */}
        <select className="rounded border px-2 py-1 text-sm bg-white" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
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

      {status === 'completed' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">
          
          {/* Column 1: Privately Completed */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex justify-between">
              <span>🔒 Privately Completed</span>
              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs">{privateDone.length}</span>
            </h3>
            {!privateDone.length ? (
              <EmptyState text="No completed private tickets." />
            ) : (
              privateDone.map((item) => {
                const displayName = item.employeeName?.trim() || item.employeeId || 'Unknown';
                return (
                  <div className="rounded border bg-white p-3 shadow-sm" key={item.id}>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
                      <p className="font-semibold text-slate-800 text-xs">{displayName} ({item.employeeId})</p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs font-semibold text-indigo-600">Room {item.roomId} - {item.category}</p>
                    <p className="text-sm text-slate-700 mt-1">{item.description}</p>
                    <CardMeta createdAt={item.completedAt || item.createdAt} />
                    {item.feedbackText && (
                      <div className="mt-2 rounded bg-slate-50 border p-2 text-xs">
                        <p className="font-semibold text-slate-800">Feedback:</p>
                        <p className="text-slate-700 font-medium">{item.feedbackText}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Column 2: Publicly Completed */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex justify-between">
              <span>📢 Publicly Completed</span>
              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs">{publicDone.length}</span>
            </h3>
            {!publicDone.length ? (
              <EmptyState text="No completed public tickets." />
            ) : (
              publicDone.map((item) => {
                const displayName = item.employeeName?.trim() || item.employeeId || 'Unknown';
                return (
                  <div className="rounded border bg-white p-3 shadow-sm" key={item.id}>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
                      <p className="font-semibold text-slate-800 text-xs">{displayName} ({item.employeeId})</p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs font-semibold text-indigo-600">Room {item.roomId} - {item.category}</p>
                    <p className="text-sm text-slate-700 mt-1">{item.description}</p>
                    <CardMeta createdAt={item.completedAt || item.createdAt} />
                    {/* Endorsements */}
                    {Array.isArray(item.endorsedBy) && item.endorsedBy.length > 0 && (
                      <div className="mt-2 text-xs text-slate-500 border-t pt-1.5">
                        <p className="font-semibold text-slate-600 mb-0.5">Endorsed By:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.endorsedBy.map((e, idx) => {
                            const empName = typeof e === 'object' ? e.employeeName : e;
                            const empId = typeof e === 'object' ? e.employeeId : e;
                            const t = typeof e === 'object' && e.endorsedAt ? ` (${formatRelativeTime(e.endorsedAt)})` : '';
                            return (
                              <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 text-[10px]">
                                {empName || empId}{t}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {item.feedbackText && (
                      <div className="mt-2 rounded bg-slate-50 border p-2 text-xs">
                        <p className="font-semibold text-slate-800">Feedback:</p>
                        <p className="text-slate-700 font-medium">{item.feedbackText}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Column 3: Merged Completed */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex justify-between">
              <span>🔗 Merged Completed</span>
              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs">{mergedDone.length}</span>
            </h3>
            {!mergedDone.length ? (
              <EmptyState text="No completed merged tickets." />
            ) : (
              mergedDone.map((group) => {
                const constituents = complaints.filter((c) =>
                  group.constituentComplaintIds.includes(c.id)
                );
                return (
                  <div className="rounded border bg-white p-3 shadow-sm" key={group.id}>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
                      <p className="font-semibold text-slate-800 text-xs">Room {group.roomId} - {group.category}</p>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] text-green-700 font-semibold">Completed</span>
                    </div>
                    <p className="text-sm text-slate-700">{group.managerDescription}</p>
                    {/* Merged Tickets detail */}
                    <div className="mt-2 space-y-1 border-t pt-1.5">
                      <p className="text-[10px] font-semibold text-slate-500">Merged Tickets & Timing:</p>
                      {constituents.map((item) => (
                        <div key={item.id} className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded">
                          <p className="font-semibold">{item.employeeName} ({item.employeeId}) - {item.createdAt ? formatRelativeTime(item.createdAt) : ''}</p>
                          <p className="mt-0.5">{item.description}</p>
                        </div>
                      ))}
                    </div>
                    {/* Endorsements list */}
                    {Array.isArray(group.endorsedBy) && group.endorsedBy.length > 0 && (
                      <div className="mt-2 text-xs text-slate-500 border-t pt-1.5">
                        <p className="font-semibold text-slate-600 mb-0.5">Endorsements ({group.endorsedBy.length}):</p>
                        <div className="flex flex-wrap gap-1">
                          {group.endorsedBy.map((e, idx) => {
                            const empName = typeof e === 'object' ? e.employeeName : e;
                            const empId = typeof e === 'object' ? e.employeeId : e;
                            const t = typeof e === 'object' && e.endorsedAt ? ` (${formatRelativeTime(e.endorsedAt)})` : '';
                            return (
                              <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 text-[10px]">
                                {empName || empId}{t}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      ) : (
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
                  <CardMeta createdAt={item.createdAt} />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
