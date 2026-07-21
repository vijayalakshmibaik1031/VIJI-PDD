import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { EmptyState } from '../../components/FacilityUI';
import { useToast } from '../../context/ToastContext';

export default function EmployeePublic() {
  const { session } = useAuth();
  const { mergedGroups, complaints, endorseMerged, endorseIndividualComplaint } = useComplaints();
  const { showToast } = useToast();

  const endorseGroup = async (id) => {
    try {
      await endorseMerged(id, session.userId);
      showToast('Merged issue endorsed');
    } catch (err) {
      showToast(err.message || 'Endorse failed');
    }
  };

  const handleEndorseIndividual = async (id) => {
    try {
      await endorseIndividualComplaint(id, session.userId);
      showToast('Public complaint endorsed');
    } catch (err) {
      showToast(err.message || 'Endorse failed');
    }
  };

  const mergedVisible = mergedGroups.filter(
    (group) =>
      Array.isArray(group.constituentComplaintIds) && group.constituentComplaintIds.length > 0 &&
      (group.status === 'merged_public' || group.status === 'escalated'),
  );

  const individualPublicVisible = complaints.filter(
    (c) =>
      c.visibility === 'public' &&
      !c.parentComplaintId &&
      !c.mergedIntoId &&
      c.status !== 'completed' &&
      c.status !== 'rejected'
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3">
          <span className="rounded bg-slate-900 px-3 py-1 text-white text-xs font-semibold">Merged / Community Issues</span>
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
                <span className={`inline-block rounded-full px-2 py-1 text-xs mt-2 ${group.status === 'escalated' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                  {group.status === 'escalated' ? 'Escalated to Authority' : 'Open for Endorsement'}
                </span>
              </details>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-3">
          <span className="rounded bg-slate-900 px-3 py-1 text-white text-xs font-semibold">Public / Individual Issues</span>
        </div>
        <div className="space-y-3">
          {!individualPublicVisible.length ? (
            <EmptyState text="No public individual issues yet." />
          ) : (
            individualPublicVisible.map((complaint) => {
              const total = Array.isArray(complaint.endorsedBy) ? complaint.endorsedBy.length : 0;
              const normalizedEndorsed = (complaint.endorsedBy || []).map((e) => String(e));
              const uid = String(session.userId);
              const already = normalizedEndorsed.includes(uid);
              const isSubmitter = String(complaint.employeeId) === uid;
              return (
                <div className="rounded-lg border bg-white p-4" key={complaint.id}>
                  <div className="font-medium text-slate-800">
                    Room {complaint.roomId} - {complaint.category}
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{complaint.description}</p>
                  <p className="text-xs text-slate-505 text-slate-500">Submitted by: {complaint.employeeName}</p>
                  <p className="text-xs text-slate-500">Total endorsements: {total}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      className="rounded border px-3 py-1 text-sm disabled:opacity-50 hover:bg-slate-50 transition"
                      disabled={already || isSubmitter || complaint.status === 'completed' || complaint.status === 'rejected'}
                      onClick={() => handleEndorseIndividual(complaint.id)}
                    >
                      {already ? 'Endorsed ✓' : isSubmitter ? 'Your Complaint' : 'Endorse'}
                    </button>
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      complaint.status === 'escalated' 
                        ? 'bg-purple-100 text-purple-700' 
                        : complaint.status === 'acknowledged' 
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-teal-100 text-teal-700'
                    }`}>
                      {complaint.status === 'escalated' 
                        ? 'Escalated to Authority' 
                        : complaint.status === 'acknowledged'
                          ? 'Acknowledged & Pending'
                          : 'Open for Endorsement'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

