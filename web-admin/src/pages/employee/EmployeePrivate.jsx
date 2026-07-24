import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { CardMeta, EmptyState, StatusBadge } from '../../components/FacilityUI';
import { apiService } from '../../utils/apiService';
import { formatRelativeTime } from '../../utils/facility';
import EmployeeRaise from './EmployeeRaise';

function buildThreads(complaints, employeeId) {
  const mine = complaints
    .filter((c) => c.employeeId === employeeId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const childToRoot = {};
  function getRootId(c) {
    if (!c.parentComplaintId) return c.id;
    if (childToRoot[c.id]) return childToRoot[c.id];
    const parent = mine.find((x) => x.id === c.parentComplaintId);
    const root = parent ? getRootId(parent) : c.id;
    childToRoot[c.id] = root;
    return root;
  }

  const threads = {};

  mine.forEach((c) => {
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

function FeedbackForm({ complaintId, onSubmitted }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await apiService.submitFeedback(complaintId, text.trim());
      onSubmitted?.();
    } catch (err) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 border-t pt-3">
      <label className="block text-xs font-semibold text-slate-600">Share your feedback (optional):</label>
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 rounded border px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="How was the resolution?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-indigo-600 px-3 py-1.5 text-xs text-white font-semibold hover:bg-indigo-500 transition disabled:opacity-50"
        >
          {submitting ? 'Sending...' : 'Submit'}
        </button>
      </div>
    </form>
  );
}

export default function EmployeePrivate() {
  const { session } = useAuth();
  const { complaints, reload } = useComplaints();
  const [reComplainDraft, setReComplainDraft] = useState(null);
  const [reComplainedIds, setReComplainedIds] = useState({});
  const [expandedThreads, setExpandedThreads] = useState({});
  const [activeTab, setActiveTab] = useState('ongoing');

  const threads = buildThreads(complaints, session?.userId);
  const allRejected = complaints.filter(
    (c) => c.employeeId === session?.userId && c.status === 'rejected',
  );

  useEffect(() => {
    if (!session?.userId || !allRejected.length) return;
    Promise.all(
      allRejected.map((c) =>
        apiService
          .hasRecomplained(session.userId, c.roomId, c.category, c.id)
          .then((res) => ({ id: c.id, value: res.hasRecomplained }))
          .catch(() => ({ id: c.id, value: false })),
      ),
    ).then((results) => {
      setReComplainedIds((prev) => {
        const next = { ...prev };
        results.forEach(({ id, value }) => {
          if (value === true) next[id] = true;
          else if (next[id] !== true) next[id] = false;
        });
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userId, allRejected.map((c) => c.id).join(',')]);

  const hasReComplainedFor = (id) => !!reComplainedIds[id];

  const markAsReComplained = async (complaintId, roomId, category) => {
    if (!session?.userId) return;
    setReComplainedIds((prev) => ({ ...prev, [complaintId]: true }));
    try {
      const res = await apiService.markRecomplained(session.userId, roomId, category, complaintId);
      if (res?.escalated) await reload();
    } catch (err) {
      console.error('mark-recomplained failed:', err.message);
    }
  };

  if (reComplainDraft) {
    return (
      <div>
        <h3 className="mb-2 text-lg font-semibold text-slate-800">Re-Complain</h3>
        <EmployeeRaise
          draft={reComplainDraft}
          onSubmitted={async () => {
            await markAsReComplained(
              reComplainDraft.id,
              reComplainDraft.roomId,
              reComplainDraft.category,
            );
            await reload();
            setReComplainDraft(null);
          }}
        />
      </div>
    );
  }

  const ongoingThreads = threads.filter(tc => !tc.some(c => c.status === 'completed'));
  const completedThreads = threads.filter(tc => tc.some(c => c.status === 'completed'));
  const visibleThreads = activeTab === 'ongoing' ? ongoingThreads : completedThreads;

  return (
    <div className="space-y-3">
      {/* Sub tabs */}
      <div className="mb-4 flex border-b">
        <button
          className={`mr-4 pb-2 text-sm font-semibold transition-colors duration-200 ${
            activeTab === 'ongoing' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('ongoing')}
        >
          Ongoing Private ({ongoingThreads.length})
        </button>
        <button
          className={`pb-2 text-sm font-semibold transition-colors duration-200 ${
            activeTab === 'completed' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('completed')}
        >
          Completed Private ({completedThreads.length})
        </button>
      </div>

      {!visibleThreads.length && <EmptyState text={`No ${activeTab} private complaints.`} />}

      {visibleThreads.map((tc) => {
        const root = tc[0];
        const latest = tc[tc.length - 1];
        const key = root.id;
        const isExpanded = !!expandedThreads[key];

        const totalRejections = tc.reduce((s, c) => s + (c.rejectionHistory?.length || 0), 0);
        const reComplainCount = tc.filter((c) => hasReComplainedFor(c.id)).length;

        // A thread is escalated if ANY complaint in it has status 'escalated'
        const escalatedComplaint = tc.find((c) => c.status === 'escalated');
        const isEscalated = !!escalatedComplaint;
        const isCompleted = tc.some((c) => c.status === 'completed');
        const latestIsRejected = latest.status === 'rejected';
        const latestAlreadyReComplained = hasReComplainedFor(latest.id);

        // Display status: if escalated, always show escalated regardless of latest
        const displayStatus = isEscalated ? 'escalated' : latest.status;

        return (
          <div
            className={`rounded-lg border bg-white p-4 ${isEscalated ? 'border-purple-300' : ''}`}
            key={key}
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-800">
                  Room {root.roomId} — {root.category}
                </p>
                <StatusBadge status={displayStatus} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {totalRejections > 0 && (
                  <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">
                    {totalRejections} rejection{totalRejections !== 1 ? 's' : ''}
                  </span>
                )}
                {reComplainCount > 0 && (
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700">
                    {reComplainCount} re-complaint{reComplainCount !== 1 ? 's' : ''}
                  </span>
                )}
                {tc.length > 1 && (
                  <button
                    className="rounded border border-slate-300 px-2 py-0.5 text-slate-600 hover:bg-slate-50"
                    onClick={() =>
                      setExpandedThreads((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                  >
                    {isExpanded ? '▲ Hide history' : `▼ Show history (${tc.length})`}
                  </button>
                )}
              </div>
            </div>

            {/* Latest description */}
            <p className="mt-2 text-sm text-slate-700">{latest.description}</p>
            <CardMeta createdAt={latest.createdAt} />

            {/* Rejection reason (only if latest is rejected AND not escalated) */}
            {latestIsRejected && !isEscalated && (
              <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                <p className="font-medium">
                  Manager reason: {latest.rejectionReason || 'No reason provided'}
                </p>
              </div>
            )}

            {/* ── Public & Open for Endorsements Notice ── */}
            {latest.visibility === 'public' && !isEscalated && !isCompleted && !latestIsRejected && (
              <div className="mt-2 rounded border border-teal-900/50 bg-teal-950/30 p-3 text-sm text-teal-400">
                <p className="font-semibold flex items-center gap-1">
                  <span>📢</span> Raised to Public
                </p>
                <p className="mt-0.5 text-slate-300 text-xs">
                  This complaint has been raised to public. Other employees can now view and endorse this issue in the "Public Complaints" section.
                </p>
                <p className="mt-1 text-xs font-semibold text-teal-300">
                  Total Endorsements: {(latest.endorsedBy || []).length}
                </p>
              </div>
            )}

            {/* ── Escalated notice — shown prominently, blocks re-complain ── */}
            {isEscalated && (
              <div className="mt-2 rounded border border-purple-900/50 bg-purple-950/30 p-3 text-sm">
                <p className="font-semibold text-fuchsia-400 flex items-center gap-1">
                  <span>▲</span> Escalated to Authority {latest.escalatedAt ? `(${formatRelativeTime(latest.escalatedAt)})` : ''}
                </p>
                {escalatedComplaint?.visibility === 'public' ? (
                  <p className="mt-0.5 text-purple-300 text-xs">
                    This public complaint has been escalated to the authority for review. No further action is required — the authority is now reviewing it.
                  </p>
                ) : (
                  <p className="mt-0.5 text-fuchsia-300 text-xs">
                    This complaint has been escalated to the authority after repeated rejections.
                    No further re-complaints can be raised — the authority is now reviewing it.
                  </p>
                )}
                {escalatedComplaint?.escalationDescription && (
                  <p className="mt-1.5 text-xs text-fuchsia-400 font-mono">
                    Reason: {escalatedComplaint.escalationDescription}
                  </p>
                )}
              </div>
            )}

            {/* Completed notice */}
            {isCompleted && (
              <>
                <div className="mt-2 rounded border border-green-900/50 bg-green-950/30 p-2 text-xs text-green-400">
                  <p className="font-medium">
                    {latest.completionDescription
                      ? `Note: ${latest.completionDescription}`
                      : 'Issue resolved'} {latest.completedAt ? `(${formatRelativeTime(latest.completedAt)})` : ''}
                  </p>
                  {latest.completionPhotoUri && (
                    <img
                      src={latest.completionPhotoUri}
                      alt="Completion proof"
                      className="mt-1 h-28 w-full max-w-xs rounded object-cover border"
                    />
                  )}
                </div>

                {latest.feedbackText ? (
                  <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3 text-xs">
                    <p className="font-semibold text-slate-800 flex justify-between">
                      <span>💬 Employee Feedback</span>
                      <span className="text-slate-400 font-normal">
                        {latest.feedbackSubmittedAt ? formatRelativeTime(latest.feedbackSubmittedAt) : ''}
                      </span>
                    </p>
                    <p className="mt-1 text-slate-700 font-medium">{latest.feedbackText}</p>
                  </div>
                ) : (
                  <FeedbackForm complaintId={latest.id} onSubmitted={reload} />
                )}
              </>
            )}

            {/* Expanded history */}
            {isExpanded && (
              <div className="mt-3 space-y-2 border-t pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Complaint History
                </p>
                {tc.map((c, idx) => (
                  <div
                    key={c.id}
                    className="rounded border border-slate-200 bg-slate-50 p-2 text-xs"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-1">
                      <span className="font-medium text-slate-500">#{idx + 1}</span>
                      <StatusBadge status={c.status} />
                      <CardMeta createdAt={c.createdAt} />
                      {hasReComplainedFor(c.id) && (
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-600">
                          Re-Complained ✓
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700">{c.description}</p>
                    {c.rejectionHistory?.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {c.rejectionHistory.map((r, ri) => (
                          <p key={ri} className="text-red-600">
                            Rejection {r.count}: {r.reason} {r.rejectedAt ? `(${formatRelativeTime(r.rejectedAt)})` : ''}
                          </p>
                        ))}
                      </div>
                    )}
                    {c.status === 'escalated' && c.escalationDescription && (
                      <p className="mt-1 text-purple-700">
                        Escalated: {c.escalationDescription}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Re-Complain button — BLOCKED if escalated or completed */}
            {latestIsRejected && !isEscalated && !isCompleted && (
              <div className="mt-3">
                {latestAlreadyReComplained ? (
                  <span className="inline-block rounded bg-slate-200 px-3 py-1 text-xs text-slate-600">
                    Re-Complained ✓ — awaiting manager review
                  </span>
                ) : (
                  <button
                    className="rounded bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700"
                    onClick={() =>
                      setReComplainDraft({
                        id: latest.id,
                        roomId: latest.roomId,
                        category: latest.category,
                        description: latest.description,
                      })
                    }
                  >
                    Re-Complain
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
