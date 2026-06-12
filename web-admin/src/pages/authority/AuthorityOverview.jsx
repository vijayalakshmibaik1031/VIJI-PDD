import { useComplaints } from '../../context/ComplaintContext';
import { EmptyState } from '../../components/FacilityUI';

export default function AuthorityOverview() {
  const { complaints, mergedGroups } = useComplaints();
  if (!complaints.length && !mergedGroups.length) return <EmptyState text="No complaints yet. Overview will appear after employee submissions." />;

  const mostRoom = complaints.reduce((acc, item) => {
    acc[item.roomId] = (acc[item.roomId] || 0) + 1;
    return acc;
  }, {});
  const [room] = Object.entries(mostRoom).sort((a, b) => b[1] - a[1])[0] || ['N/A'];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      <div className="rounded border bg-white p-4"><p className="text-xs text-slate-500">Total</p><p className="text-2xl font-semibold text-slate-800">{complaints.length}</p></div>
      <div className="rounded border bg-white p-4"><p className="text-xs text-slate-500">Pending</p><p className="text-2xl font-semibold text-slate-800">{complaints.filter((item) => item.status === 'pending').length}</p></div>
      <div className="rounded border bg-white p-4"><p className="text-xs text-slate-500">In Progress</p><p className="text-2xl font-semibold text-slate-800">{complaints.filter((item) => item.status === 'in_progress').length}</p></div>
      <div className="rounded border bg-white p-4"><p className="text-xs text-slate-500">Completed</p><p className="text-2xl font-semibold text-slate-800">{complaints.filter((item) => item.status === 'completed').length}</p></div>
      <div className="rounded border bg-white p-4"><p className="text-xs text-slate-500">Merged Groups</p><p className="text-2xl font-semibold text-slate-800">{mergedGroups.length}</p></div>
      <div className="rounded border bg-white p-4"><p className="text-xs text-slate-500">Most Complained Room</p><p className="text-2xl font-semibold text-slate-800">{room}</p></div>
    </div>
  );
}

