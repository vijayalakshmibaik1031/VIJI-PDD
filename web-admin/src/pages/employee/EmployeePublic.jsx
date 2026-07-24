import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { EmptyState } from '../../components/FacilityUI';
import { useToast } from '../../context/ToastContext';
import { formatRelativeTime } from '../../utils/facility';

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
    <div className="mt-4 border-t pt-3 space-y-3 bg-slate-50 p-3 rounded text-left">
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

export default function EmployeePublic() {
  const { session } = useAuth();
  const { mergedGroups, complaints, endorseMerged, endorseIndividualComplaint } = useComplaints();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('ongoing'); // ongoing or completed
  const [expandedMerged, setExpandedMerged] = useState({});
  const [expandedIndividual, setExpandedIndividual] = useState({});

  const endorseGroup = async (id) => {
    try {
      await endorseMerged(id, session.userId);
      showToast('Merged issue endorsed');
    } catch (err) {
      showToast(err.message || 'Endorse failed');
    }
  };

  const handleEndorseIndividual = async (id) => {
    try {
      await endorseIndividualComplaint(id, session.userId);
      showToast('Public complaint endorsed');
    } catch (err) {
      showToast(err.message || 'Endorse failed');
    }
  };

  // Filter merged groups
  const mergedOngoing = mergedGroups.filter(
    (group) =>
      Array.isArray(group.constituentComplaintIds) && group.constituentComplaintIds.length > 0 &&
      (group.status === 'merged_public' || group.status === 'escalated' || group.status === 'acknowledged')
  );

  const mergedCompleted = mergedGroups.filter(
    (group) =>
      Array.isArray(group.constituentComplaintIds) && group.constituentComplaintIds.length > 0 &&
      group.status === 'completed'
  );

  // Build set of constituent complaint IDs belonging to any merged group
  const allMergedConstituentIds = useMemo(() => {
    const ids = new Set();
    mergedGroups.forEach((group) => {
      const list = group.constituentComplaintIds || group.constituent_complaint_ids || [];
      if (Array.isArray(list)) {
        list.forEach((id) => ids.add(String(id)));
      }
    });
    return ids;
  }, [mergedGroups]);

  // Group complaints into threads
  const threads = useMemo(() => buildThreadsAll(complaints), [complaints]);

  // Filter individual public complaints (excluding any that are merged into a group)
  const individualOngoing = threads.filter((tc) => {
    const latest = tc[tc.length - 1];
    const isCompleted = tc.some(c => c.status === 'completed');
    const isMerged = tc.some(c => c.mergedIntoId || allMergedConstituentIds.has(String(c.id)));
    return (
      latest.visibility === 'public' &&
      !isCompleted &&
      latest.status !== 'rejected' &&
      !isMerged
    );
  });

  const individualCompleted = threads.filter((tc) => {
    const latest = tc[tc.length - 1];
    const isCompleted = tc.some(c => c.status === 'completed');
    const isMerged = tc.some(c => c.mergedIntoId || allMergedConstituentIds.has(String(c.id)));
    return (
      latest.visibility === 'public' &&
      isCompleted &&
      !isMerged
    );
  });

  const mergedVisible = activeTab === 'ongoing' ? mergedOngoing : mergedCompleted;
  const individualPublicVisible = activeTab === 'ongoing' ? individualOngoing : individualCompleted;

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="mb-4 flex border-b">
        <button
          className={`mr-4 pb-2 text-sm font-semibold transition-colors duration-200 ${
            activeTab === 'ongoing' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('ongoing')}
        >
          Ongoing Community Feed ({mergedOngoing.length + individualOngoing.length})
        </button>
        <button
          className={`pb-2 text-sm font-semibold transition-colors duration-200 ${
            activeTab === 'completed' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('completed')}
        >
          Completed Community Feed ({mergedCompleted.length + individualCompleted.length})
        </button>
      </div>

      <div>
        <div className="mb-3">
          <span className="rounded bg-slate-900 px-3 py-1 text-white text-xs font-semibold">Merged / Community Issues</span>
        </div>
        <div className="space-y-3">
          {!mergedVisible.length ? <EmptyState text={`No ${activeTab} merged issues yet.`} /> : mergedVisible.map((group) => {
            const items = complaints.filter((complaint) => group.constituentComplaintIds.includes(complaint.id));
            const total = Array.isArray(group.endorsedBy) ? group.endorsedBy.length : 0;
            const normalizedEndorsed = (group.endorsedBy || []).map((e) => typeof e === 'object' ? String(e.employeeId) : String(e));
            const uid = String(session.userId);
            const already = normalizedEndorsed.includes(uid);
            const isExpanded = !!expandedMerged[group.id];

            return (
              <div className="rounded-lg border bg-white p-4 shadow-sm" key={group.id}>
                <div className="font-medium text-slate-800 flex justify-between items-center cursor-pointer" onClick={() => setExpandedMerged(prev => ({ ...prev, [group.id]: !prev[group.id] }))}>
                  <span>Room {group.roomId} - {group.category}</span>
                  <div className="flex items-center gap-2">
                    {activeTab === 'completed' && <span className="text-xs text-green-600 font-semibold">Completed</span>}
                    <span className="text-xs text-slate-400">{isExpanded ? '▲ Hide' : '▼ Expand'}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-700">{group.managerDescription}</p>

                {/* Detailed Endorsements list with times */}
                {Array.isArray(group.endorsedBy) && group.endorsedBy.length > 0 && (
                  <div className="mt-2 text-xs text-slate-500 border-t pt-2">
                    <p className="font-semibold text-slate-600 mb-1">Endorsed By:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.endorsedBy.map((e, idx) => {
                        const empName = typeof e === 'object' ? e.employeeName : e;
                        const empId = typeof e === 'object' ? e.employeeId : e;
                        const t = typeof e === 'object' && e.endorsedAt ? ` (${formatRelativeTime(e.endorsedAt)})` : '';
                        return (
                          <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {empName || empId}{t}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'ongoing' && (
                  <button className="mt-2 rounded border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-3 py-1 text-sm disabled:opacity-50 font-semibold" disabled={already || group.status !== 'merged_public'} onClick={() => endorseGroup(group.id)}>
                    {already ? 'Endorsed ✓' : 'Endorse'}
                  </button>
                )}

                {isExpanded && (
                  <div className="mt-3 space-y-4 border-t pt-3">
                    <p className="text-xs font-semibold text-slate-500">Constituent Tickets & Timelines:</p>
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
          })}
        </div>
      </div>

      <div>
        <div className="mb-3">
          <span className="rounded bg-slate-900 px-3 py-1 text-white text-xs font-semibold">Public / Individual Issues</span>
        </div>
        <div className="space-y-3">
          {!individualPublicVisible.length ? (
            <EmptyState text={`No ${activeTab} public individual issues yet.`} />
          ) : (
            individualPublicVisible.map((tc) => {
              const root = tc[0];
              const latest = tc[tc.length - 1];
              const key = root.id;
              const total = Array.isArray(latest.endorsedBy) ? latest.endorsedBy.length : 0;
              const normalizedEndorsed = (latest.endorsedBy || []).map((e) => typeof e === 'object' ? String(e.employeeId) : String(e));
              const uid = String(session.userId);
              const already = normalizedEndorsed.includes(uid);
              const isExpanded = !!expandedIndividual[key];

              return (
                <div className="rounded-lg border bg-white p-4 shadow-sm" key={key}>
                  <div className="font-medium text-slate-800 flex justify-between items-center cursor-pointer" onClick={() => setExpandedIndividual(prev => ({ ...prev, [key]: !prev[key] }))}>
                    <span>Room {root.roomId} - {root.category}</span>
                    <span className="text-xs text-slate-400">{isExpanded ? '▲ Hide' : '▼ View History & Timeline'}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{latest.description}</p>
                  <p className="text-xs text-slate-500 mt-2">Submitted by: {root.employeeName} ({root.createdAt ? formatRelativeTime(root.createdAt) : ''})</p>

                  {/* Detailed Endorsements list with times */}
                  {Array.isArray(latest.endorsedBy) && latest.endorsedBy.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500 border-t pt-2">
                      <p className="font-semibold text-slate-600 mb-1">Endorsed By:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {latest.endorsedBy.map((e, idx) => {
                          const empName = typeof e === 'object' ? e.employeeName : e;
                          const empId = typeof e === 'object' ? e.employeeId : e;
                          const t = typeof e === 'object' && e.endorsedAt ? ` (${formatRelativeTime(e.endorsedAt)})` : '';
                          return (
                            <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              {empName || empId}{t}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === 'ongoing' && (
                    <button className="mt-2 rounded border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-3 py-1 text-sm disabled:opacity-50 font-semibold" disabled={already} onClick={() => handleEndorseIndividual(latest.id)}>
                      {already ? 'Endorsed ✓' : 'Endorse'}
                    </button>
                  )}

                  {isExpanded && (
                    <WorkflowHistory thread={tc} formatRelativeTime={formatRelativeTime} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
