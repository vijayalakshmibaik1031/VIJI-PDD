import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { EmptyState } from '../../components/FacilityUI';
import { useToast } from '../../context/ToastContext';

export default function EmployeePublic() {
  const { session } = useAuth();
  const { mergedGroups, complaints, endorseMerged } = useComplaints();
  const { showToast } = useToast();

  const endorseGroup = async (id) => {
    try {
      await endorseMerged(id, session.userId);
      showToast('Merged issue endorsed');
    } catch (err) {
      showToast(err.message || 'Endorse failed');
    }
  };

  const mergedVisible = mergedGroups.filter(
    (group) =>
      Array.isArray(group.constituentComplaintIds) && group.constituentComplaintIds.length > 0 &&
      (group.status === 'merged_public' || group.status === 'escalated'),
  );

  return (
    <div>
      <div className="mb-3">
        <span className="rounded bg-slate-900 px-3 py-1 text-white">Merged / Community Issues</span>
      </div>
      <div className="space-y-3">
        {!mergedVisible.length ? <EmptyState text="No merged issues yet." /> : mergedVisible.map((group) => {
          const items = complaints.filter((complaint) => group.constituentComplaintIds.includes(complaint.id));
          const total = Array.isArray(group.endorsedBy) ? group.endorsedBy.length : 0;
          const normalizedEndorsed = (group.endorsedBy || []).map((e) => String(e));
          const uid = String(session.userId);
          const already = normalizedEndorsed.includes(uid);
          return (
            <details className="rounded-lg border bg-white p-4" key={group.id}>
              <summary className="cursor-pointer font-medium text-slate-800">Room {group.roomId} - {group.category}</summary>
              <p className="mt-2 text-sm text-slate-700">{group.managerDescription}</p>
              <p className="text-xs text-slate-500">Total endorsements: {total}</p>
              <button className="mt-2 rounded border px-3 py-1 text-sm disabled:opacity-50" disabled={already || group.status !== 'merged_public'} onClick={() => endorseGroup(group.id)}>
                {already ? 'Endorsed ✓' : 'Endorse'}
              </button>
              <div className="mt-2 space-y-1">
                {items.map((item) => <p key={item.id} className="text-xs text-slate-600">- {item.description}</p>)}
              </div>
              <span className={`inline-block rounded-full px-2 py-1 text-xs ${group.status === 'escalated' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                {group.status === 'escalated' ? 'Escalated to Authority' : 'Open for Endorsement'}
              </span>
            </details>
          );
        })}
      </div>
    </div>
  );
}

