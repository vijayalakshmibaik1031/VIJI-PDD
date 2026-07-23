import { useState, useMemo, useRef } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { EmptyState, StatusBadge, CardMeta } from '../../components/FacilityUI';
import { useToast } from '../../context/ToastContext';

export default function AuthorityEscalated() {
  const { complaints = [], mergedGroups = [], acknowledgeComplaint, acknowledgeMergedComplaint, completeComplaint, completeMergedComplaint } = useComplaints();
  const { showToast } = useToast();

  const busySetRef = useRef(new Set());
  const [processingId, setProcessingId] = useState(null);

  // Individual complaints escalated (by manager after 5 rejections, or manually)
  const escalatedComplaints = useMemo(
    () => (complaints || []).filter((c) => c && c.status === 'escalated'),
    [complaints]
  );

  // Acknowledged individual complaints
  const acknowledgedComplaints = useMemo(
    () => (complaints || []).filter((c) => c && c.status === 'acknowledged'),
    [complaints]
  );

  // Merged groups escalated by manager OR high-priority (10+ endorsements or 7+ days old)
  const mergedNeedingAttention = useMemo(() => {
    const now = Date.now();
    const seen = new Set();
    const result = [];

    (mergedGroups || [])
      .filter((g) => g && g.status === 'escalated')
      .forEach((g) => { seen.add(g.id); result.push({ ...g, _reason: 'escalated' }); });

    (mergedGroups || [])
      .filter((g) => {
        if (!g || seen.has(g.id)) return false;
        const endorsedList = g.endorsedBy || g.endorsed_by || [];
        const createdDate = g.createdAt || g.created_at;
        const olderThan7d = createdDate ? now - new Date(createdDate).getTime() > 7 * 24 * 60 * 60 * 1000 : false;
        return endorsedList.length >= 10 || olderThan7d;
      })
      .forEach((g) => {
        const endorsedList = g.endorsedBy || g.endorsed_by || [];
        const createdDate = g.createdAt || g.created_at;
        const olderThan7d = createdDate ? now - new Date(createdDate).getTime() > 7 * 24 * 60 * 60 * 1000 : false;
        const reason = endorsedList.length >= 10 ? 'high endorsements' : olderThan7d ? 'older than 7 days' : '';
        seen.add(g.id);
        result.push({ ...g, _reason: reason });
      });

    return result;
  }, [mergedGroups]);

  const acknowledgedMerged = useMemo(
    () => (mergedGroups || []).filter((g) => g && g.status === 'acknowledged'),
    [mergedGroups]
  );

  const handleAcknowledgeComplaint = async (id) => {
    if (busySetRef.current.has(id)) return;
    busySetRef.current.add(id);
    setProcessingId(id);
    try {
      await acknowledgeComplaint(id);
      showToast('Complaint acknowledged');
    } catch (err) {
      showToast(err.message || 'Failed to acknowledge');
      busySetRef.current.delete(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAcknowledgeMerged = async (id) => {
    if (busySetRef.current.has(id)) return;
    busySetRef.current.add(id);
    setProcessingId(id);
    try {
      await acknowledgeMergedComplaint(id);
      showToast('Merged group acknowledged');
    } catch (err) {
      showToast(err.message || 'Failed to acknowledge');
      busySetRef.current.delete(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteComplaint = async (id) => {
    if (busySetRef.current.has(id)) return;
    busySetRef.current.add(id);
    setProcessingId(id);
    try {
      await completeComplaint(id, 'Resolved by Authority', null);
      showToast('Complaint completed by Authority');
    } catch (err) {
      showToast(err.message || 'Failed to complete complaint');
      busySetRef.current.delete(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteMerged = async (id) => {
    if (busySetRef.current.has(id)) return;
    busySetRef.current.add(id);
    setProcessingId(id);
    try {
      await completeMergedComplaint(id, 'Resolved by Authority', null);
      showToast('Merged issue completed by Authority');
    } catch (err) {
      showToast(err.message || 'Failed to complete merged issue');
      busySetRef.current.delete(id);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Escalated individual complaints ── */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-slate-800">
          Escalated Complaints
          {escalatedComplaints.length > 0 && (
            <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-sm font-medium text-purple-700">
              {escalatedComplaints.length}
            </span>
          )}
        </h3>

        {escalatedComplaints.length ? (
          <div className="space-y-3">
            {escalatedComplaints.map((complaint) => {
              const rejCount = complaint.rejectionHistory?.length || 0;
              const autoEscalated = rejCount >= 5;
              return (
                <div
                  key={complaint.id}
                  className="rounded-lg border border-purple-200 bg-white p-4 shadow-sm"
                >
                  {/* Header row */}
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-800">
                      Room {complaint.roomId} — {complaint.category}
                    </p>
                    <StatusBadge status={complaint.status} />

                    {/* Source badge — auto vs manual escalation */}
                    {autoEscalated ? (
                      <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                        Escalated by Manager · {rejCount} rejections
                      </span>
                    ) : (
                      <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                        Manually Escalated by Manager
                      </span>
                    )}
                  </div>

                  {/* Employee info */}
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Employee:</span>{' '}
                    {complaint.employeeName}
                    {complaint.employeeId ? ` (${complaint.employeeId})` : ''}
                  </p>

                  {/* Original complaint */}
                  <p className="mt-1 text-sm text-slate-700">{complaint.description}</p>

                  {/* Escalation reason — this is what the manager wrote */}
                  {complaint.escalationDescription && (
                    <div className="mt-2 rounded border border-purple-200 bg-purple-50 p-2">
                      <p className="text-xs font-semibold text-purple-700 mb-0.5">
                        Manager's Escalation Reason
                      </p>
                      <p className="text-sm text-purple-800">{complaint.escalationDescription}</p>
                    </div>
                  )}

                  {/* Rejection history summary */}
                  {rejCount > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700">
                        View rejection history ({rejCount} rejection{rejCount !== 1 ? 's' : ''})
                      </summary>
                      <div className="mt-1 space-y-1 pl-2">
                        {complaint.rejectionHistory.map((r, i) => (
                          <p key={i} className="text-xs text-slate-600">
                            <span className="font-medium">#{r.count ?? i + 1}:</span> {r.reason}
                          </p>
                        ))}
                      </div>
                    </details>
                  )}

                  <CardMeta createdAt={complaint.createdAt} />

                  <button
                    className="mt-3 rounded bg-indigo-700 px-3 py-1 text-sm text-white hover:bg-indigo-800 disabled:opacity-50"
                    disabled={processingId === complaint.id}
                    onClick={() => handleAcknowledgeComplaint(complaint.id)}
                  >
                    {processingId === complaint.id ? 'Acknowledging...' : 'Mark Acknowledged'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState text="No escalated complaints." />
        )}
      </div>

      {/* ── Escalated & high-priority merged groups ── */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-slate-800">
          Escalated / High Priority Merged Groups
        </h3>
        {mergedNeedingAttention.length ? (
          <div className="space-y-3">
            {mergedNeedingAttention.map((group) => {
              const constituentIds = group.constituentComplaintIds || group.constituent_complaint_ids || [];
              const endorsedList = group.endorsedBy || group.endorsed_by || [];
              const items = complaints.filter((c) => c && constituentIds.includes(c.id));
              const isEscalated = group.status === 'escalated';
              return (
                <div
                  key={group.id}
                  className={`rounded-lg border bg-white p-4 shadow-sm ${isEscalated ? 'border-purple-300' : 'border-l-4 border-rose-400'}`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-800">
                      Room {group.roomId} — {group.category}
                    </p>
                    <StatusBadge status={group.status} />
                    {isEscalated && (
                      <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                        Escalated by Manager
                      </span>
                    )}
                    {group._reason && group._reason !== 'escalated' && (
                      <span className="rounded bg-rose-100 px-2 py-1 text-xs text-rose-700">
                        {group._reason}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700">{group.managerDescription || group.manager_description}</p>
                  <p className="text-xs text-slate-500 mt-1">Endorsements: {endorsedList.length}</p>
                  {group.escalationNote ? (
                    <div className="mt-2 rounded border border-purple-200 bg-purple-50 p-2">
                      <p className="text-xs font-semibold text-purple-700 mb-0.5">Manager's Escalation Note</p>
                      <p className="text-sm text-purple-800">{group.escalationNote}</p>
                    </div>
                  ) : null}
                  {items.length > 0 && (
                    <div className="mt-2 rounded border border-slate-200 p-2">
                      <p className="mb-1 text-xs font-medium text-slate-700">Original Complaints</p>
                      {items.map((item) => (
                        <p key={item.id} className="text-xs text-slate-600">
                          — {item.employeeName}: {item.description}
                        </p>
                      ))}
                    </div>
                  )}
                  <button
                    className="mt-3 rounded bg-indigo-700 px-3 py-1 text-sm text-white hover:bg-indigo-800 disabled:opacity-50"
                    disabled={processingId === group.id}
                    onClick={() => handleAcknowledgeMerged(group.id)}
                  >
                    {processingId === group.id ? 'Acknowledging...' : 'Mark Acknowledged'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState text="No escalated or high-priority merged groups." />
        )}
      </div>

      {/* ── Acknowledged section ── */}
      {(acknowledgedComplaints.length > 0 || acknowledgedMerged.length > 0) && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-slate-800">Acknowledged</h3>
          <div className="space-y-3">
            {acknowledgedComplaints.map((complaint) => (
              <div key={complaint.id} className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-800">
                    Room {complaint.roomId} — {complaint.category}
                  </p>
                  <StatusBadge status={complaint.status} />
                </div>
                <p className="text-sm text-slate-700">
                  {complaint.employeeName}
                  {complaint.employeeId ? ` (${complaint.employeeId})` : ''}
                </p>
                <p className="text-sm text-slate-700">{complaint.description}</p>
                <CardMeta createdAt={complaint.createdAt} />
                <div className="mt-3">
                  <button
                    className="rounded bg-green-700 hover:bg-green-800 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                    disabled={processingId === complaint.id}
                    onClick={() => handleCompleteComplaint(complaint.id)}
                  >
                    {processingId === complaint.id ? 'Completing...' : 'Mark as Complete'}
                  </button>
                </div>
              </div>
            ))}
            {acknowledgedMerged.map((group) => (
              <div key={group.id} className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-800">
                    Room {group.roomId} — {group.category}
                  </p>
                  <StatusBadge status={group.status} />
                </div>
                <p className="text-sm text-slate-700">{group.managerDescription || group.manager_description}</p>
                <p className="text-xs text-slate-500">Endorsements: {(group.endorsedBy || group.endorsed_by || []).length}</p>
                <div className="mt-3">
                  <button
                    className="rounded bg-green-700 hover:bg-green-800 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                    disabled={processingId === group.id}
                    onClick={() => handleCompleteMerged(group.id)}
                  >
                    {processingId === group.id ? 'Completing...' : 'Mark as Complete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
