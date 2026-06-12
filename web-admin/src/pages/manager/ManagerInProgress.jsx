import { useComplaints } from '../../context/ComplaintContext';
import { CardMeta, EmptyState, StatusBadge } from '../../components/FacilityUI';
import { useToast } from '../../context/ToastContext';
import { useState } from 'react';

export default function ManagerInProgress() {
  const { complaints, completeComplaint } = useComplaints();
  const { showToast } = useToast();
  const [completingId, setCompletingId] = useState(null);
  const inProgressComplaints = complaints.filter((complaint) => complaint.status === 'in_progress');

  const handleFile = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const photoUri = reader.result;
      setCompletingId(id);
      try {
        await completeComplaint(id, '', photoUri);
        showToast('Marked as completed');
      } catch (err) {
        showToast(err.message || 'Complete failed');
      } finally {
        setCompletingId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCompleteClick = async (id) => {
    setCompletingId(id);
    try {
      await completeComplaint(id, '', null);
      showToast('Marked as completed');
    } catch (err) {
      showToast(err.message || 'Complete failed');
    } finally {
      setCompletingId(null);
    }
  };

  if (!inProgressComplaints.length) return <EmptyState text="No in-progress complaints." />;

  return (
    <div className="space-y-3">
      {inProgressComplaints.map((item) => {
        const displayName = item.employeeName?.trim() || item.employeeId || 'Unknown';
        const displayId = item.employeeName?.trim() && item.employeeId ? ` (${item.employeeId})` : '';
        return (
          <div className="rounded-lg border bg-white p-4" key={item.id}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="font-medium text-slate-800">{displayName}{displayId}</p>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-sm text-slate-700">Room {item.roomId} - {item.category}</p>
            <p className="text-sm text-slate-700">{item.description}</p>
            <CardMeta createdAt={item.createdAt} />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <input
                type="file"
                accept="image/*"
                className="text-sm"
                onChange={(e) => handleFile(item.id, e.target.files?.[0])}
                disabled={completingId === item.id}
              />
              <button
                className="rounded bg-green-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                onClick={() => handleCompleteClick(item.id)}
                disabled={completingId === item.id}
              >
                {completingId === item.id ? 'Completing...' : 'Mark as Complete'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

