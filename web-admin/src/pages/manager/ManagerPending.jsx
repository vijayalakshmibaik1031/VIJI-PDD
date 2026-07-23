import { useState } from 'react';
import { CardMeta, EmptyState, StatusBadge } from '../../components/FacilityUI';
import { useComplaints } from '../../context/ComplaintContext';
import { useToast } from '../../context/ToastContext';

export default function ManagerPending() {
  const { pendingUnmerged, updateComplaintStatus, rejectComplaint, getRejectionCount, raiseComplaintToPublic } = useComplaints();
  const { showToast } = useToast();
  const [activeModal, setActiveModal] = useState(null);
  const [reasonText, setReasonText] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!pendingUnmerged.length) return <EmptyState text="No complaints yet. Pending list is empty." />;

  const openModal = (complaint) => {
    setActiveModal(complaint);
    setReasonText('');
  };

  const closeModal = () => {
    setActiveModal(null);
    setReasonText('');
  };

  const confirmDecision = async () => {
    if (isSubmitting) return;
    if (!activeModal || reasonText.trim().length < 5) {
      showToast('Enter a valid reason (min 5 characters)');
      return;
    }
    const complaintId = activeModal.id;
    const reason = reasonText.trim();
    setIsSubmitting(true);
    closeModal();

    try {
      const res = await rejectComplaint(complaintId, reason);
      if (res && res.escalated === true) {
        showToast('Complaint escalated to authority');
      } else {
        showToast('Complaint rejected');
      }
    } catch (err) {
      showToast(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {pendingUnmerged.map((complaint) => {
          const rejectionCount = getRejectionCount(
            complaint.employeeId,
            complaint.roomId,
            complaint.category,
          );
          const displayName = complaint.employeeName?.trim() || complaint.employeeId || 'Unknown';
          const displayId =
            complaint.employeeName?.trim() && complaint.employeeId
              ? ` (${complaint.employeeId})`
              : '';
          // Warn when the next rejection will be the 5th (auto-escalate)
          const willEscalate = rejectionCount >= 4;

          return (
            <div className="rounded-lg border bg-white p-4" key={complaint.id}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="font-medium text-slate-800">
                  {displayName}
                  {displayId}
                </p>
                <StatusBadge status={complaint.status} />
                {rejectionCount > 0 && (
                  <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">
                    Rejected {rejectionCount} time{rejectionCount !== 1 ? 's' : ''}
                  </span>
                )}
                {willEscalate && (
                  <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                    ⚠ Next rejection escalates to authority
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700">
                Room {complaint.roomId} - {complaint.category}
              </p>
              <p className="text-sm text-slate-700">{complaint.description}</p>
              <CardMeta createdAt={complaint.createdAt} />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {complaint.visibility === 'private' && (
                  <>
                    <button
                      className="rounded bg-blue-700 hover:bg-blue-800 disabled:opacity-50 px-3 py-1.5 text-sm text-white"
                      disabled={busyId === complaint.id}
                      onClick={async () => {
                        if (busyId) return;
                        setBusyId(complaint.id);
                        try {
                          await updateComplaintStatus(complaint.id, 'in_progress');
                          showToast('Complaint accepted');
                        } finally {
                          setBusyId(null);
                        }
                      }}
                    >
                      {busyId === complaint.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      className={`rounded px-3 py-1.5 text-sm text-white disabled:opacity-50 ${
                        willEscalate ? 'bg-amber-600' : 'bg-red-700'
                      }`}
                      disabled={busyId === complaint.id}
                      onClick={() => openModal(complaint)}
                    >
                      {willEscalate ? 'Reject & Escalate' : 'Reject'}
                    </button>
                    <button
                      className="rounded bg-indigo-700 hover:bg-indigo-850 disabled:opacity-50 px-3 py-1.5 text-sm text-white font-medium transition duration-200"
                      disabled={busyId === complaint.id}
                      onClick={async () => {
                        if (busyId) return;
                        setBusyId(complaint.id);
                        try {
                          await raiseComplaintToPublic(complaint.id);
                          showToast('Complaint raised to public');
                        } catch (err) {
                          showToast(err.message || 'Failed to raise to public');
                        } finally {
                          setBusyId(null);
                        }
                      }}
                    >
                      {busyId === complaint.id ? 'Processing...' : 'Raise to Public'}
                    </button>
                  </>
                )}
                {complaint.visibility === 'public' && (
                  <span className="text-xs text-slate-500 font-medium italic border border-slate-200 bg-slate-50 rounded px-2.5 py-1">
                    Public issue open for endorsements
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeModal
        ? (() => {
            const count = getRejectionCount(
              activeModal.employeeId,
              activeModal.roomId,
              activeModal.category,
            );
            const willEscalate = count >= 4;
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-lg">
                  {willEscalate ? (
                    <div className="mb-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                      <p className="mb-1 font-semibold">⚠ This will escalate to Authority</p>
                      <p>
                        This complaint has been rejected{' '}
                        <strong>{count}</strong> time{count !== 1 ? 's' : ''}. Rejecting again
                        will automatically escalate it to the authority — it will{' '}
                        <strong>not</strong> be marked as rejected.
                      </p>
                    </div>
                  ) : (
                    <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      <p className="mb-1 font-semibold">Rejecting Complaint</p>
                      <p>
                        Rejection {count + 1} of 5. At 5 rejections the complaint is
                        automatically escalated to authority.
                      </p>
                    </div>
                  )}

                  <p className="mb-2 text-sm font-medium text-slate-800">
                    {willEscalate ? 'Escalation Reason' : 'Rejection Reason'}
                  </p>
                  <textarea
                    className="w-full rounded border px-3 py-2 text-sm"
                    rows={4}
                    placeholder="Minimum 5 characters"
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <button className="rounded border px-3 py-1 text-sm" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className={`rounded px-3 py-1 text-sm text-white disabled:opacity-50 ${
                        willEscalate ? 'bg-amber-600' : 'bg-red-700'
                      }`}
                      disabled={isSubmitting}
                      onClick={confirmDecision}
                    >
                      {isSubmitting ? 'Processing...' : willEscalate ? 'Confirm & Escalate to Authority' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        : null}
    </>
  );
}
