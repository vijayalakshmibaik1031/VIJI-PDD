import { useComplaints } from '../../context/ComplaintContext';

export default function AuthorityOverview() {
  const complaintsCtx = useComplaints() || {};
  const complaints = Array.isArray(complaintsCtx.complaints) ? complaintsCtx.complaints : [];
  const mergedGroups = Array.isArray(complaintsCtx.mergedGroups) ? complaintsCtx.mergedGroups : [];

  const total = complaints.length;
  const pending = complaints.filter((item) => item.status === 'pending').length;
  const inProgress = complaints.filter((item) => item.status === 'in_progress').length;
  const completed = complaints.filter((item) => item.status === 'completed').length;
  const mergedCount = mergedGroups.length;

  const mostRoomMap = complaints.reduce((acc, item) => {
    if (item.roomId) {
      acc[item.roomId] = (acc[item.roomId] || 0) + 1;
    }
    return acc;
  }, {});
  const [mostRoom] = Object.entries(mostRoomMap).sort((a, b) => b[1] - a[1])[0] || ['N/A'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">System Overview</h2>
        <p className="text-xs text-slate-400">Live facility complaint statistics and system metrics</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-lg">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Complaints</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{total}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-lg">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pending</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-400">{pending}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-lg">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">In Progress</p>
          <p className="mt-2 text-3xl font-extrabold text-blue-400">{inProgress}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-lg">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Completed</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-400">{completed}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-lg">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Merged Groups</p>
          <p className="mt-2 text-3xl font-extrabold text-purple-400">{mergedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-lg">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Most Complained Room</p>
          <p className="mt-2 text-3xl font-extrabold text-indigo-400">{mostRoom}</p>
        </div>
      </div>

      {total === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center text-slate-400">
          <div className="mb-2 text-3xl">📭</div>
          <p className="text-sm font-medium text-slate-300">No facility complaints reported yet.</p>
          <p className="text-xs text-slate-500 mt-1">Overview metrics will update live as employee complaints are submitted.</p>
        </div>
      )}
    </div>
  );
}
