import { useMemo, useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { EmptyState, StatusBadge, VisibilityBadge, CardMeta } from '../../components/FacilityUI';
import { CATEGORIES, STATUS, formatRelativeTime, formatFloorName } from '../../utils/facility';

function buildThreadsAll(complaints) {
  const sorted = [...complaints].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const childToRoot = {};
  function getRootId(c) {
    if (!c.parentComplaintId) return c.id;
    if (childToRoot[c.id]) return childToRoot[c.id];
    const parent = sorted.find((x) => x.id === c.parentComplaintId);
    const root = parent ? getRootId(parent) : c.id;
    childToRoot[c.id] = root;
    return root;
  }

  const threads = {};

  sorted.forEach((c) => {
    const rootId = getRootId(c);
    if (!threads[rootId]) threads[rootId] = [];
    threads[rootId].push(c);
  });

  return Object.values(threads).sort((a, b) => {
    const aLast = new Date(a[a.length - 1].createdAt);
    const bLast = new Date(b[b.length - 1].createdAt);
    return bLast - aLast;
  });
}

function WorkflowHistory({ thread, formatRelativeTime }) {
  const events = [];

  thread.forEach((c, idx) => {
    // 1. Raise Event
    events.push({
      type: 'raise',
      title: idx === 0 ? '📝 Ticket Raised' : `🔄 Resubmitted Re-Complain #${idx}`,
      time: c.createdAt,
      description: `Description: "${c.description}" by ${c.employeeName || c.employeeId}`,
    });

    // 2. Rejection Events
    if (c.status === 'rejected' && c.rejectedAt) {
      events.push({
        type: 'reject',
        title: `❌ Rejected by Manager`,
        time: c.rejectedAt,
        description: `Reason: "${c.rejectionReason || 'No details'}"`,
      });
    }

    if (Array.isArray(c.rejectionHistory)) {
      c.rejectionHistory.forEach((r) => {
        events.push({
          type: 'reject',
          title: `❌ Rejected (Rejection #${r.count || 1})`,
          time: r.rejectedAt || c.rejectedAt || c.updatedAt,
          description: `Reason: "${r.reason || 'No details'}"`,
        });
      });
    }

    // 3. Escalation Event
    if (c.status === 'escalated' && c.escalatedAt) {
      events.push({
        type: 'escalate',
        title: `▲ Escalated to Authority`,
        time: c.escalatedAt,
        description: c.escalationDescription ? `Reason: "${c.escalationDescription}"` : 'Auto-escalated due to repeated rejections.',
      });
    }

    // 4. Completion Event
    if (c.status === 'completed' && c.completedAt) {
      events.push({
        type: 'complete',
        title: `✅ Completed & Resolved`,
        time: c.completedAt,
        description: c.completionDescription ? `Resolution note: "${c.completionDescription}"` : 'Issue marked resolved.',
      });
    }

    // 5. Feedback Event
    if (c.feedbackText && c.feedbackSubmittedAt) {
      events.push({
        type: 'feedback',
        title: `💬 Feedback Submitted`,
        time: c.feedbackSubmittedAt,
        description: `Feedback: "${c.feedbackText}"`,
      });
    }

    // 6. Endorsement Events
    if (Array.isArray(c.endorsedBy)) {
      c.endorsedBy.forEach((e) => {
        events.push({
          type: 'endorse',
          title: `👥 Endorsement Added`,
          time: e.endorsedAt || c.updatedAt,
          description: `Endorsed by: ${e.employeeName || e.employeeId}`,
        });
      });
    }
  });

  events.sort((a, b) => new Date(a.time) - new Date(b.time));

  return (
    <div className="mt-4 border-t pt-3 space-y-3 bg-slate-50 p-3 rounded">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Workflow Timeline & History</p>
      <div className="relative pl-4 border-l-2 border-slate-200 ml-2 space-y-4">
        {events.map((ev, index) => (
          <div key={index} className="relative">
            <div className="absolute -left-[21px] top-1 bg-white border-2 border-indigo-600 rounded-full h-3 w-3" />
            <div>
              <p className="text-xs font-bold text-slate-800 flex justify-between gap-2">
                <span>{ev.title}</span>
                <span className="text-[10px] text-slate-400 font-normal">{ev.time ? formatRelativeTime(ev.time) : ''}</span>
              </p>
              <p className="text-xs text-slate-600 mt-0.5">{ev.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuthorityAll() {
  const { complaints, mergedGroups } = useComplaints();
  const [activeTab, setActiveTab] = useState('pending'); // pending, ongoing, completed
  const [subCategory, setSubCategory] = useState('private'); // private, public, merged

  const [room, setRoom] = useState('');
  const [category, setCategory] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDay, setFilterDay] = useState('');

  const [expandedThreads, setExpandedThreads] = useState({});

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

  const threads = useMemo(() => buildThreadsAll(complaints), [complaints]);

  // Apply filters to threads
  const filteredThreads = useMemo(() => {
    return threads.filter((tc) => {
      const root = tc[0];
      const latest = tc[tc.length - 1];

      const itemDate = new Date(root.createdAt || root.created_at);
      const y = itemDate.getFullYear().toString();
      const m = (itemDate.getMonth() + 1).toString();
      const d = itemDate.getDate().toString();

      if (room && !root.roomId.toLowerCase().includes(room.toLowerCase())) return false;
      if (category && root.category !== category) return false;
      if (filterYear && y !== filterYear) return false;
      if (filterMonth && m !== filterMonth) return false;
      if (filterDay && d !== filterDay) return false;

      const isCompleted = tc.some(c => c.status === 'completed');
      const escalatedComplaint = tc.find(c => c.status === 'escalated');
      const isEscalated = !!escalatedComplaint;
      const latestStatus = latest.status;

      if (activeTab === 'pending') {
        if (latestStatus !== 'pending') return false;
      } else if (activeTab === 'ongoing') {
        if (isCompleted || (latestStatus !== 'in-progress' && !isEscalated && latestStatus !== 'rejected' && latestStatus !== 'recomplained')) return false;
      } else if (activeTab === 'completed') {
        if (!isCompleted) return false;
      }

      if (subCategory === 'private') {
        if (latest.visibility !== 'private') return false;
      } else if (subCategory === 'public') {
        if (latest.visibility !== 'public') return false;
      } else {
        return false;
      }

      return true;
    });
  }, [threads, activeTab, subCategory, room, category, filterYear, filterMonth, filterDay]);

  // Apply filters to merged groups
  const filteredMerged = useMemo(() => {
    if (subCategory !== 'merged') return [];
    return mergedGroups.filter((group) => {
      const itemDate = new Date(group.createdAt || group.created_at);
      const y = itemDate.getFullYear().toString();
      const m = (itemDate.getMonth() + 1).toString();
      const d = itemDate.getDate().toString();

      if (room && !group.roomId.toLowerCase().includes(room.toLowerCase())) return false;
      if (category && group.category !== category) return false;
      if (filterYear && y !== filterYear) return false;
      if (filterMonth && m !== filterMonth) return false;
      if (filterDay && d !== filterDay) return false;

      if (activeTab === 'pending') {
        return false;
      } else if (activeTab === 'ongoing') {
        return group.status === 'merged_public' || group.status === 'escalated' || group.status === 'acknowledged';
      } else if (activeTab === 'completed') {
        return group.status === 'completed';
      }

      return true;
    });
  }, [mergedGroups, activeTab, subCategory, room, category, filterYear, filterMonth, filterDay]);

  const isEmpty = subCategory === 'merged' ? !filteredMerged.length : !filteredThreads.length;

  return (
    <div className="space-y-4">
      {/* Search filters */}
      <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <input
          className="rounded border px-2 py-1 text-sm bg-white text-slate-800"
          placeholder="Filter by room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <select
          className="rounded border px-2 py-1 text-sm bg-white text-slate-800"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="rounded border px-2 py-1 text-sm bg-white text-slate-800"
          value={filterDay}
          onChange={(e) => setFilterDay(e.target.value)}
        >
          <option value="">All Days</option>
          {days.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          className="rounded border px-2 py-1 text-sm bg-white text-slate-800"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        >
          <option value="">All Months</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select
          className="rounded border px-2 py-1 text-sm bg-white text-slate-800"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        >
          <option value="">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Main Tabs (Pending, Ongoing, Completed) */}
      <div className="flex border-b">
        {['pending', 'ongoing', 'completed'].map((tab) => (
          <button
            key={tab}
            className={`mr-6 pb-2 text-sm font-semibold transition-colors duration-200 uppercase ${
              activeTab === tab
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sub-tabs (Private, Public, Merged) */}
      <div className="flex gap-4">
        {['private', 'public', 'merged'].map((sub) => {
          if (activeTab === 'pending' && sub === 'merged') return null;
          return (
            <button
              key={sub}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border transition ${
                subCategory === sub
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
              onClick={() => setSubCategory(sub)}
            >
              {sub}
            </button>
          );
        })}
      </div>

      {/* List Content */}
      <div className="space-y-3">
        {isEmpty ? (
          <EmptyState text={`No ${activeTab} ${subCategory} complaints found.`} />
        ) : subCategory === 'merged' ? (
          filteredMerged.map((group) => {
            const items = complaints.filter((c) => group.constituentComplaintIds.includes(c.id));
            const isExpanded = !!expandedThreads[group.id];
            return (
              <div className="rounded border bg-white p-4 shadow-sm" key={group.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-800 text-sm">Room {group.roomId} - {group.category}</p>
                  <button
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                    onClick={() => setExpandedThreads(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                  >
                    {isExpanded ? '▲ Hide Constituents & Timeline' : `▼ View Constituents & Timelines (${items.length})`}
                  </button>
                </div>
                <p className="text-sm text-slate-700 mt-1">{group.managerDescription}</p>

                {isExpanded && (
                  <div className="mt-3 space-y-4 border-t pt-3">
                    <p className="text-xs font-bold text-slate-500 uppercase">Constituent Tickets:</p>
                    {items.map((complaint) => {
                      const complThread = threads.find(tc => tc.some(c => c.id === complaint.id)) || [complaint];
                      return (
                        <div key={complaint.id} className="border p-3 rounded bg-slate-50">
                          <p className="font-semibold text-xs text-slate-800">
                            Raised by {complaint.employeeName} ({complaint.employeeId})
                          </p>
                          <WorkflowHistory thread={complThread} formatRelativeTime={formatRelativeTime} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          filteredThreads.map((tc) => {
            const root = tc[0];
            const latest = tc[tc.length - 1];
            const key = root.id;
            const isExpanded = !!expandedThreads[key];
            const displayStatus = tc.find(c => c.status === 'escalated') ? 'escalated' : latest.status;

            return (
              <div className="rounded border bg-white p-4 shadow-sm" key={key}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-800 text-sm">Room {root.roomId} - {root.category}</p>
                    <StatusBadge status={displayStatus} />
                    <VisibilityBadge visibility={latest.visibility} />
                  </div>
                  <button
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                    onClick={() => setExpandedThreads(prev => ({ ...prev, [key]: !prev[key] }))}
                  >
                    {isExpanded ? '▲ Hide Timeline' : '▼ View History & Timeline'}
                  </button>
                </div>
                <p className="text-sm text-slate-700 mt-1">{latest.description}</p>
                <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded border border-slate-100">
                  <span>👤 Raised by: <strong className="text-slate-700">{root.employeeName || root.employeeId}</strong></span>
                  <span>🏢 Floor: <strong className="text-indigo-700">{formatFloorName(root.floor_number || root.floorNumber)}</strong></span>
                  <span>👔 Floor Manager: <strong className="text-slate-700">{root.floor_manager_name || root.floorManagerName || 'N/A'}</strong></span>
                </div>

                {isExpanded && (
                  <WorkflowHistory thread={tc} formatRelativeTime={formatRelativeTime} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
