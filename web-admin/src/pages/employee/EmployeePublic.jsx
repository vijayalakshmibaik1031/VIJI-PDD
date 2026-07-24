import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { EmptyState } from '../../components/FacilityUI';
import { useToast } from '../../context/ToastContext';
import { formatRelativeTime } from '../../utils/facility';

export default function EmployeePublic() {
  const { session } = useAuth();
  const { mergedGroups, complaints, endorseMerged, endorseIndividualComplaint } = useComplaints();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('ongoing');

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

  // Filter merged groups
  const mergedOngoing = mergedGroups.filter(
    (group) =>
      Array.isArray(group.constituentComplaintIds) && group.constituentComplaintIds.length > 0 &&
      (group.status === 'merged_public' || group.status === 'escalated')
  );

  const mergedCompleted = mergedGroups.filter(
    (group) =>
      Array.isArray(group.constituentComplaintIds) && group.constituentComplaintIds.length > 0 &&
      group.status === 'completed'
  );

  // Filter individual public complaints
  const individualOngoing = complaints.filter(
    (c) =>
      c.visibility === 'public' &&
      !c.parentComplaintId &&
      !c.mergedIntoId &&
      c.status !== 'completed' &&
      c.status !== 'rejected'
  );

  const individualCompleted = complaints.filter(
    (c) =>
      c.visibility === 'public' &&
      !c.parentComplaintId &&
      !c.mergedIntoId &&
      c.status === 'completed'
  );

  const mergedVisible = activeTab === 'ongoing' ? mergedOngoing : mergedCompleted;
  const individualPublicVisible = activeTab === 'ongoing' ? individualOngoing : individualCompleted;

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="mb-4 flex border-b">
        <button
          className={`mr-4 pb-2 text-sm font-semibold transition-colors duration-200 ${
            activeTab === 'ongoing' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('ongoing')}
        >
          Ongoing Community Feed ({mergedOngoing.length + individualOngoing.length})
        </button>
        <button
          className={`pb-2 text-sm font-semibold transition-colors duration-200 ${
            activeTab === 'completed' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('completed')}
        >
          Completed Community Feed ({mergedCompleted.length + individualCompleted.length})
        </button>
      </div>

      <div>
        <div className="mb-3">
          <span className="rounded bg-slate-900 px-3 py-1 text-white text-xs font-semibold">Merged / Community Issues</span>
        </div>
        <div className="space-y-3">
          {!mergedVisible.length ? <EmptyState text={`No ${activeTab} merged issues yet.`} /> : mergedVisible.map((group) => {
            const items = complaints.filter((complaint) => group.constituentComplaintIds.includes(complaint.id));
            const total = Array.isArray(group.endorsedBy) ? group.endorsedBy.length : 0;
            const normalizedEndorsed = (group.endorsedBy || []).map((e) => typeof e === 'object' ? String(e.employeeId) : String(e));
            const uid = String(session.userId);
            const already = normalizedEndorsed.includes(uid);
            return (
              <details className="rounded-lg border bg-white p-4" key={group.id} open={activeTab === 'completed'}>
                <summary className="cursor-pointer font-medium text-slate-800 flex justify-between">
                  <span>Room {group.roomId} - {group.category}</span>
                  {activeTab === 'completed' && <span className="text-xs text-green-600 font-semibold">Completed</span>}
                </summary>
                <p className="mt-2 text-sm text-slate-700">{group.managerDescription}</p>
                <p className="text-xs text-slate-500 mt-1">Total endorsements: {total}</p>
                {activeTab === 'ongoing' && (
                  <button className="mt-2 rounded border px-3 py-1 text-sm disabled:opacity-50" disabled={already || group.status !== 'merged_public'} onClick={() => endorseGroup(group.id)}>
                    {already ? 'Endorsed ✓' : 'Endorse'}
                  </button>
                )}
                
                {/* List constituent complaints with their details */}
                <div className="mt-3 space-y-1.5 border-t pt-2">
                  <p className="text-xs font-semibold text-slate-500">Merged Tickets:</p>
                  {items.map((item) => (
                    <div key={item.id} className="text-xs text-slate-600 bg-slate-50 p-1.5 rounded">
                      <p className="font-semibold">{item.employeeName} ({item.employeeId}) - {item.createdAt ? formatRelativeTime(item.createdAt) : ''}</p>
                      <p className="mt-0.5">{item.description}</p>
                    </div>
                  ))}
                </div>

                {/* Detailed Endorsements list with times */}
                {Array.isArray(group.endorsedBy) && group.endorsedBy.length > 0 && (
                  <div className="mt-2 text-xs text-slate-500 border-t pt-2">
                    <p className="font-semibold text-slate-600 mb-1">Endorsed By:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.endorsedBy.map((e, idx) => {
                        const empName = typeof e === 'object' ? e.employeeName : e;
                        const empId = typeof e === 'object' ? e.employeeId : e;
                        const t = typeof e === 'object' && e.endorsedAt ? ` (${formatRelativeTime(e.endorsedAt)})` : '';
                        return (
                          <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {empName || empId}{t}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                <span className={`inline-block rounded-full px-2 py-1 text-xs mt-2 ${group.status === 'escalated' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                  {group.status === 'escalated' ? 'Escalated to Authority' : group.status === 'completed' ? 'Resolved & Closed' : 'Open for Endorsement'}
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
            <EmptyState text={`No ${activeTab} public individual issues yet.`} />
          ) : (
            individualPublicVisible.map((complaint) => {
              const total = Array.isArray(complaint.endorsedBy) ? complaint.endorsedBy.length : 0;
              const normalizedEndorsed = (complaint.endorsedBy || []).map((e) => typeof e === 'object' ? String(e.employeeId) : String(e));
              const uid = String(session.userId);
              const already = normalizedEndorsed.includes(uid);
              const isSubmitter = String(complaint.employeeId) === uid;
              return (
                <div className="rounded-lg border bg-white p-4" key={complaint.id}>
                  <div className="font-medium text-slate-800 flex justify-between">
                    <span>Room {complaint.roomId} - {complaint.category}</span>
                    {complaint.raisedToPublicAt && (
                      <span className="text-xs text-slate-400 font-normal">Public since: {formatRelativeTime(complaint.raisedToPublicAt)}</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{complaint.description}</p>
                  <p className="text-xs text-slate-500 mt-2">Submitted by: {complaint.employeeName} ({complaint.createdAt ? formatRelativeTime(complaint.createdAt) : ''})</p>
                  <p className="text-xs text-slate-500 mt-0.5">Total endorsements: {total}</p>

                  {/* Detailed Endorsements list with times */}
                  {Array.isArray(complaint.endorsedBy) && complaint.endorsedBy.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500 border-t pt-2">
                      <p className="font-semibold text-slate-600 mb-1">Endorsed By:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {complaint.endorsedBy.map((e, idx) => {
                          const empName = typeof e === 'object' ? e.employeeName : e;
                          const empId = typeof e === 'object' ? e.employeeId : e;
                          const t = typeof e === 'object' && e.endorsedAt ? ` (${formatRelativeTime(e.endorsedAt)})` : '';
                          return (
                            <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              {empName || empId}{t}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-3">
                    {activeTab === 'ongoing' && (
                      <button
                        className="rounded border px-3 py-1 text-sm disabled:opacity-50 hover:bg-slate-50 transition"
                        disabled={already || isSubmitter || complaint.status === 'completed' || complaint.status === 'rejected'}
                        onClick={() => handleEndorseIndividual(complaint.id)}
                      >
                        {already ? 'Endorsed ✓' : isSubmitter ? 'Your Complaint' : 'Endorse'}
                      </button>
                    )}
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      complaint.status === 'escalated' 
                        ? 'bg-purple-100 text-purple-700' 
                        : complaint.status === 'acknowledged' 
                          ? 'bg-blue-100 text-blue-700'
                          : complaint.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-teal-100 text-teal-700'
                    }`}>
                      {complaint.status === 'escalated' 
                        ? 'Escalated to Authority' 
                        : complaint.status === 'acknowledged'
                          ? 'Acknowledged & Pending'
                          : complaint.status === 'completed'
                            ? 'Resolved & Closed'
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

