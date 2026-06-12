import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { CATEGORIES } from '../../utils/facility';
import { RoomPicker } from '../../components/FacilityUI';
import { useToast } from '../../context/ToastContext';

export default function EmployeeRaise({ draft, onSubmitted }) {
  const { session } = useAuth();
  const { addComplaint, complaints } = useComplaints();
  const { showToast } = useToast();
  const [roomId, setRoomId] = useState(draft?.roomId || '');
  const [category, setCategory] = useState(draft?.category || CATEGORIES[0]);
  const [description, setDescription] = useState(draft?.description || '');
  const [submitting, setSubmitting] = useState(false);
  const isReComplain = !!draft;

  // Build a set of room+category combos that are already escalated for this employee
  // so we can block raising a new complaint for them
  const escalatedKeys = useMemo(() => {
    if (!session?.userId) return new Set();
    return new Set(
      complaints
        .filter((c) => c.employeeId === session.userId && c.status === 'escalated')
        .map((c) => `${c.roomId}__${c.category}`),
    );
  }, [complaints, session?.userId]);

  const currentKey = roomId && category ? `${roomId}__${category}` : null;
  const isEscalatedCombo = currentKey ? escalatedKeys.has(currentKey) : false;

  const submit = async (event) => {
    event.preventDefault();
    if (!session?.userId) {
      showToast('Please login to submit a complaint');
      return;
    }
    if (!roomId || !category || !description.trim()) return;

    // Block submission if this room+category is already escalated
    if (isEscalatedCombo) {
      showToast('This complaint has been escalated to authority. No further complaints allowed.');
      return;
    }

    if (typeof addComplaint !== 'function') {
      showToast('Complaints service unavailable');
      return;
    }
    setSubmitting(true);
    try {
      await addComplaint({
        employeeId: session.userId,
        employeeName: session.name,
        roomId,
        category,
        description: description.trim(),
        parentComplaintId: draft?.id || null,
      });
      showToast('Complaint submitted');
      setRoomId('');
      setCategory(CATEGORIES[0]);
      setDescription('');
      onSubmitted?.(draft?.id);
    } catch (err) {
      showToast(err.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border bg-white p-4">
      <h2 className="text-xl font-semibold text-slate-800">
        {isReComplain ? 'Re-Complain' : 'Raise Complaint'}
      </h2>

      <div>
        <p className="mb-2 text-sm font-medium">Room</p>
        {isReComplain ? (
          <div className="rounded border bg-slate-100 px-3 py-2 font-medium">{roomId}</div>
        ) : (
          <RoomPicker selected={roomId} onSelect={setRoomId} />
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Category</p>
        {isReComplain ? (
          <div className="rounded border bg-slate-100 px-3 py-2 font-medium">{category}</div>
        ) : (
          <select
            className="w-full rounded border px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Escalation block warning */}
      {isEscalatedCombo && (
        <div className="rounded border border-purple-300 bg-purple-50 p-3 text-sm text-purple-800">
          <p className="font-semibold">🔺 Complaint Escalated to Authority</p>
          <p className="mt-0.5">
            A complaint for Room {roomId} — {category} has already been escalated to the
            authority. You cannot raise another complaint for this room and category until it
            is resolved.
          </p>
        </div>
      )}

      <textarea
        className="w-full rounded border px-3 py-2"
        placeholder="Describe issue"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <p className="text-xs text-slate-500">
        All complaints are submitted as private. Only merged issues become public.
      </p>
      <button
        type="submit"
        disabled={submitting || isEscalatedCombo}
        className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
