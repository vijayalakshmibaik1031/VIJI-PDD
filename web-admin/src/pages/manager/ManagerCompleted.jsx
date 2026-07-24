import { useComplaints } from '../../context/ComplaintContext';
import { CardMeta, EmptyState, StatusBadge } from '../../components/FacilityUI';
import { formatRelativeTime } from '../../utils/facility';

export default function ManagerCompleted() {
  const { complaints, mergedGroups } = useComplaints();

  const privateDone = complaints.filter(
    (item) => item.status === 'completed' && item.visibility === 'private'
  );
  const publicDone = complaints.filter(
    (item) => item.status === 'completed' && item.visibility === 'public'
  );
  const mergedDone = mergedGroups.filter(
    (group) => group.status === 'completed'
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Column 1: Privately Completed */}
        <div className="space-y-4">
          <h3 className="text-md font-bold text-slate-800 border-b pb-2">
            🔒 Privately Completed ({privateDone.length})
          </h3>
          {!privateDone.length ? (
            <EmptyState text="No completed private tickets." />
          ) : (
            privateDone.map((item) => {
              const displayName = item.employeeName?.trim() || item.employeeId || 'Unknown';
              return (
                <div className="rounded-lg border bg-white p-4 shadow-sm" key={item.id}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                    <p className="font-semibold text-slate-800 text-sm">{displayName} ({item.employeeId})</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs font-semibold text-indigo-600">Room {item.roomId} - {item.category}</p>
                  <p className="text-sm text-slate-700 mt-1">{item.description}</p>
                  <CardMeta createdAt={item.completedAt || item.createdAt} />
                  {item.completionDescription && (
                    <p className="mt-2 text-xs text-slate-700 bg-green-50 p-2 rounded">
                      Resolution: {item.completionDescription}
                    </p>
                  )}
                  {item.completionPhotoUri && (
                    <img src={item.completionPhotoUri} alt="proof" className="mt-2 h-24 w-full rounded border object-cover" />
                  )}
                  {/* Feedback */}
                  {item.feedbackText && (
                    <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-2 text-xs">
                      <p className="font-semibold text-slate-800 flex justify-between">
                        <span>💬 Feedback</span>
                        <span className="text-slate-400 font-normal">
                          {item.feedbackSubmittedAt ? formatRelativeTime(item.feedbackSubmittedAt) : ''}
                        </span>
                      </p>
                      <p className="mt-1 text-slate-700 font-medium">{item.feedbackText}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Column 2: Publicly Completed */}
        <div className="space-y-4">
          <h3 className="text-md font-bold text-slate-800 border-b pb-2">
            📢 Publicly Completed ({publicDone.length})
          </h3>
          {!publicDone.length ? (
            <EmptyState text="No completed public tickets." />
          ) : (
            publicDone.map((item) => {
              const displayName = item.employeeName?.trim() || item.employeeId || 'Unknown';
              return (
                <div className="rounded-lg border bg-white p-4 shadow-sm" key={item.id}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                    <p className="font-semibold text-slate-800 text-sm">{displayName} ({item.employeeId})</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs font-semibold text-indigo-600">Room {item.roomId} - {item.category}</p>
                  <p className="text-sm text-slate-700 mt-1">{item.description}</p>
                  <CardMeta createdAt={item.completedAt || item.createdAt} />
                  {item.completionDescription && (
                    <p className="mt-2 text-xs text-slate-700 bg-green-50 p-2 rounded">
                      Resolution: {item.completionDescription}
                    </p>
                  )}
                  {item.completionPhotoUri && (
                    <img src={item.completionPhotoUri} alt="proof" className="mt-2 h-24 w-full rounded border object-cover" />
                  )}
                  {/* Endorsements with time */}
                  {Array.isArray(item.endorsedBy) && item.endorsedBy.length > 0 && (
                    <div className="mt-3 text-xs text-slate-500 border-t pt-2">
                      <p className="font-semibold text-slate-600 mb-1">Endorsed By ({item.endorsedBy.length}):</p>
                      <div className="flex flex-wrap gap-1">
                        {item.endorsedBy.map((e, idx) => {
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
                  {/* Feedback */}
                  {item.feedbackText && (
                    <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-2 text-xs">
                      <p className="font-semibold text-slate-800 flex justify-between">
                        <span>💬 Feedback</span>
                        <span className="text-slate-400 font-normal">
                          {item.feedbackSubmittedAt ? formatRelativeTime(item.feedbackSubmittedAt) : ''}
                        </span>
                      </p>
                      <p className="mt-1 text-slate-700 font-medium">{item.feedbackText}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Column 3: Merged Completed */}
        <div className="space-y-4">
          <h3 className="text-md font-bold text-slate-800 border-b pb-2">
            🔗 Merged Completed ({mergedDone.length})
          </h3>
          {!mergedDone.length ? (
            <EmptyState text="No completed merged issues." />
          ) : (
            mergedDone.map((group) => {
              const constituents = complaints.filter((c) =>
                group.constituentComplaintIds.includes(c.id)
              );
              return (
                <div className="rounded-lg border bg-white p-4 shadow-sm" key={group.id}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                    <p className="font-semibold text-slate-800 text-sm">Room {group.roomId} - {group.category}</p>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 font-semibold">Completed</span>
                  </div>
                  <p className="text-sm text-slate-700">{group.managerDescription}</p>
                  
                  {/* Merged Tickets detail */}
                  <div className="mt-3 space-y-1.5 border-t pt-2">
                    <p className="text-xs font-semibold text-slate-500">Merged Tickets & Timing:</p>
                    {constituents.map((item) => (
                      <div key={item.id} className="text-xs text-slate-600 bg-slate-50 p-1.5 rounded">
                        <p className="font-semibold">{item.employeeName} ({item.employeeId}) - {item.createdAt ? formatRelativeTime(item.createdAt) : ''}</p>
                        <p className="mt-0.5">{item.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Endorsements detailed list */}
                  {Array.isArray(group.endorsedBy) && group.endorsedBy.length > 0 && (
                    <div className="mt-3 text-xs text-slate-500 border-t pt-2">
                      <p className="font-semibold text-slate-600 mb-1">Endorsements ({group.endorsedBy.length}):</p>
                      <div className="flex flex-wrap gap-1">
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
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
