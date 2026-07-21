import { useState } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { EmptyState, StatusBadge } from '../../components/FacilityUI';
import { useToast } from '../../context/ToastContext';

export default function ManagerMerge() {
  const { complaints, mergeCandidates, mergeComplaints, mergedGroups, escalateMergedComplaint, escalateComplaint } = useComplaints();
  const { showToast } = useToast();
  const [activeMergeGroup, setActiveMergeGroup] = useState(null);
  const [mergeDescription, setMergeDescription] = useState('');
  const [activeEscalateGroup, setActiveEscalateGroup] = useState(null);
  const [escalationNote, setEscalationNote] = useState('');
  const [activeEndorseGroup, setActiveEndorseGroup] = useState(null);
  const [activeEndorseComplaint, setActiveEndorseComplaint] = useState(null);
  const [activeEscalateComplaint, setActiveEscalateComplaint] = useState(null);
  const [individualEscalationNote, setIndividualEscalationNote] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  const getEmployeeName = (employeeId) => complaints.find((item) => item.employeeId === employeeId)?.employeeName || employeeId;

  const confirmMerge = async () => {
    if (!activeMergeGroup || !mergeDescription.trim()) return;
    setIsMerging(true);
    try {
      await mergeComplaints({
        roomId: activeMergeGroup.roomId,
        category: activeMergeGroup.category,
        complaintIds: activeMergeGroup.complaints.map((item) => item.id),
        managerDescription: mergeDescription.trim(),
      });
      showToast('Merged complaint is now public');
      setActiveMergeGroup(null);
      setMergeDescription('');
    } catch (err) {
      showToast(err.message || 'Merge failed');
    } finally {
      setIsMerging(false);
    }
  };

  const confirmEscalation = async () => {
    if (!activeEscalateGroup) return;
    await escalateMergedComplaint(activeEscalateGroup.id, escalationNote.trim());
    showToast('Merged complaint escalated to authority');
    setActiveEscalateGroup(null);
    setEscalationNote('');
  };

  const confirmIndividualEscalation = async () => {
    if (!activeEscalateComplaint) return;
    try {
      await escalateComplaint(activeEscalateComplaint.id, individualEscalationNote.trim() || 'Escalated by Manager');
      showToast('Complaint escalated to authority');
      setActiveEscalateComplaint(null);
      setIndividualEscalationNote('');
    } catch (err) {
      showToast(err.message || 'Escalation failed');
    }
  };

  return (
    <div className="space-y-4">
      {!mergeCandidates.length ? <EmptyState text="No auto-merge groups yet (need 5+ employees for same room and category)." /> : mergeCandidates.map((group) => {
        const key = `${group.roomId}-${group.category}`;
        return (
          <div className="rounded-lg border bg-white p-4" key={key}>
            <p className="font-semibold text-slate-800">Room {group.roomId} - {group.category} ({group.complaints.length} complaints)</p>
            <div className="mt-2 space-y-1">
              {group.complaints.map((complaint) => (
                <p key={complaint.id} className="text-sm text-slate-700">- {complaint.employeeName}: {complaint.description}</p>
              ))}
            </div>
            <button className="mt-2 rounded bg-slate-900 px-3 py-1 text-sm text-white" onClick={() => setActiveMergeGroup(group)}>
              Merge
            </button>
          </div>
        );
      })}

      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-2 font-semibold text-slate-800">Merged Groups</h3>
        {!mergedGroups.length ? <EmptyState text="No merged groups yet." /> : mergedGroups.map((group) => {
          const total = group.endorsedBy.length;
          const canEscalate = total >= 5 && group.status === 'merged_public';
          return (
            <div className="mb-2 rounded border p-3" key={group.id}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-slate-800">Room {group.roomId} - {group.category}</p>
                <StatusBadge status={group.status} />
              </div>
              <p className="text-xs text-slate-600">Total endorsements: {total}</p>
              <button className="mt-1 rounded bg-slate-700 px-2 py-1 text-xs text-white" onClick={() => setActiveEndorseGroup(group)}>
                Endorsed details
              </button>
              {canEscalate ? <button className="mt-2 rounded bg-purple-700 px-2 py-1 text-xs text-white" onClick={() => setActiveEscalateGroup(group)}>Escalate to Authority</button> : null}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-2 font-semibold text-slate-800">Public Individual Complaints</h3>
        {(() => {
          const individualPublic = complaints.filter(
            (c) => c.visibility === 'public' && !c.parentComplaintId && !c.mergedIntoId && c.status !== 'completed' && c.status !== 'rejected'
          );
          if (!individualPublic.length) return <EmptyState text="No public individual complaints yet." />;
          return individualPublic.map((complaint) => {
            const total = (complaint.endorsedBy || []).length;
            const canEscalate = total >= 5 && complaint.status === 'pending';
            return (
              <div className="mb-2 rounded border p-3" key={complaint.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-800">Room {complaint.roomId} - {complaint.category}</p>
                  <StatusBadge status={complaint.status} />
                </div>
                <p className="text-sm text-slate-700 mt-1">{complaint.description}</p>
                <p className="text-xs text-slate-500 mt-0.5">Submitted by: {complaint.employeeName}</p>
                <p className="text-xs text-slate-600">Total endorsements: {total}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="rounded bg-slate-700 px-2 py-1 text-xs text-white" onClick={() => setActiveEndorseComplaint(complaint)}>
                    Endorsed details
                  </button>
                  {canEscalate ? (
                    <button className="rounded bg-purple-700 px-2 py-1 text-xs text-white" onClick={() => setActiveEscalateComplaint(complaint)}>
                      Escalate to Authority
                    </button>
                  ) : null}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {activeMergeGroup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-4">
            <p className="mb-2 text-sm font-medium text-slate-800">Manager Merge Description</p>
            <textarea className="w-full rounded border px-3 py-2" rows={4} value={mergeDescription} onChange={(event) => setMergeDescription(event.target.value)} />
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded border px-3 py-1 text-sm" onClick={() => setActiveMergeGroup(null)} disabled={isMerging}>Cancel</button>
              <button className="rounded bg-slate-900 px-3 py-1 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed" onClick={confirmMerge} disabled={isMerging}>
                {isMerging ? 'Merging...' : 'Confirm Merge'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeEscalateGroup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-4">
            <p className="mb-2 text-sm font-medium text-slate-800">Escalation note (optional)</p>
            <textarea className="w-full rounded border px-3 py-2" rows={4} value={escalationNote} onChange={(event) => setEscalationNote(event.target.value)} />
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded border px-3 py-1 text-sm" onClick={() => setActiveEscalateGroup(null)}>Cancel</button>
              <button className="rounded bg-purple-700 px-3 py-1 text-sm text-white" onClick={confirmEscalation}>Confirm Escalate</button>
            </div>
          </div>
        </div>
      ) : null}

      {activeEscalateComplaint ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-4">
            <p className="mb-2 text-sm font-medium text-slate-800">Escalation note (optional)</p>
            <textarea className="w-full rounded border px-3 py-2" rows={4} value={individualEscalationNote} onChange={(event) => setIndividualEscalationNote(event.target.value)} />
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded border px-3 py-1 text-sm" onClick={() => setActiveEscalateComplaint(null)}>Cancel</button>
              <button className="rounded bg-purple-700 px-3 py-1 text-sm text-white" onClick={confirmIndividualEscalation}>Confirm Escalate</button>
            </div>
          </div>
        </div>
      ) : null}

      {activeEndorseGroup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-4">
            <p className="mb-2 text-sm font-medium text-slate-800">Endorsed Employee Details</p>
            {activeEndorseGroup.endorsedBy.length ? (
              <ul className="space-y-2 text-sm text-slate-700">
                {activeEndorseGroup.endorsedBy.map((employeeId) => (
                  <li key={employeeId} className="rounded border bg-slate-50 px-3 py-2">
                     {getEmployeeName(employeeId)}{employeeId ? ` (${employeeId})` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">No endorsements yet.</p>
            )}
            <div className="mt-3 flex justify-end">
              <button className="rounded bg-slate-900 px-3 py-1 text-sm text-white" onClick={() => setActiveEndorseGroup(null)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}

      {activeEndorseComplaint ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-4">
            <p className="mb-2 text-sm font-medium text-slate-800">Endorsed Employee Details</p>
            {activeEndorseComplaint.endorsedBy.length ? (
              <ul className="space-y-2 text-sm text-slate-700">
                {activeEndorseComplaint.endorsedBy.map((employeeId) => (
                  <li key={employeeId} className="rounded border bg-slate-50 px-3 py-2">
                     {getEmployeeName(employeeId)}{employeeId ? ` (${employeeId})` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">No endorsements yet.</p>
            )}
            <div className="mt-3 flex justify-end">
              <button className="rounded bg-slate-900 px-3 py-1 text-sm text-white" onClick={() => setActiveEndorseComplaint(null)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

