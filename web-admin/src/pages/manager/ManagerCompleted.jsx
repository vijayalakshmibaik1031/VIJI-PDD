import { useComplaints } from '../../context/ComplaintContext';
import { CardMeta, EmptyState, StatusBadge } from '../../components/FacilityUI';

export default function ManagerCompleted() {
  const { complaints } = useComplaints();
  const done = complaints.filter((item) => item.status === 'completed');
  if (!done.length) return <EmptyState text="No completed complaints." />;
  return (
    <div className="space-y-3">
      {done.map((item) => {
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
            <CardMeta createdAt={item.completedAt || item.createdAt} />
            {item.completionDescription ? <p className="mt-2 text-sm text-slate-700">Completion note: {item.completionDescription}</p> : null}
            {item.completionPhotoUri ? <img src={item.completionPhotoUri} alt="proof" className="mt-3 h-32 rounded border object-cover" /> : <p className="mt-3 text-sm text-slate-600">No proof image.</p>}
          </div>
        );
      })}
    </div>
  );
}

