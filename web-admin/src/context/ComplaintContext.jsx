import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { STATUS, VISIBILITY } from '../utils/facility';
import { apiService } from '../utils/apiService';
import { useAuth } from './AuthContext';

const ComplaintContext = createContext({
  complaints: [],
  mergedGroups: [],
  loading: true,
  error: null,
  pendingUnmerged: [],
  mergeCandidates: [],
  reload: async () => {},
  addComplaint: async () => {},
  endorseMerged: async () => {},
  updateComplaintStatus: async () => {},
  completeComplaint: async () => {},
  rejectComplaint: async () => {},
  escalateComplaint: async () => {},
  acknowledgeComplaint: async () => {},
  escalateMergedComplaint: async () => {},
  acknowledgeMergedComplaint: async () => {},
  mergeComplaints: async () => {},
  getRejectionCount: () => 0,
  status: {},
  visibility: {},
});

export function ComplaintProvider({ children }) {
  const { session } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [mergedGroups, setMergedGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeComplaint = (complaint) => ({
    id: complaint.id,
    employeeId: complaint.employee_id || complaint.employeeId,
    employeeName: complaint.employee_name || complaint.employeeName,
    roomId: complaint.room_id || complaint.roomId,
    category: complaint.category,
    description: complaint.description,
    status: complaint.status,
    parentComplaintId: complaint.parent_complaint_id || complaint.parentComplaintId || null,
    mergedIntoId: complaint.merged_into_id || complaint.mergedIntoId,
    rejectionReason: complaint.rejection_reason || complaint.rejectionReason,
    escalationDescription: complaint.escalation_description || complaint.escalationDescription,
    completionDescription: complaint.completion_description || complaint.completionDescription,
    completionPhotoUri: complaint.completion_photo_uri || complaint.completionPhotoUri,
    completedAt: complaint.completed_at || complaint.completedAt,
    rejectionHistory:
      typeof complaint.rejection_history === 'string'
        ? JSON.parse(complaint.rejection_history || '[]')
        : complaint.rejection_history || complaint.rejectionHistory || [],
    visibility: complaint.visibility || 'private',
    createdAt: complaint.created_at || complaint.createdAt,
  });

  const safeParse = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value || '[]');
      } catch {
        return [];
      }
    }
    return [];
  };

  const normalizeMergedGroup = (group) => ({
    id: group.id,
    roomId: group.room_id || group.roomId,
    category: group.category,
    managerDescription: group.manager_description || group.managerDescription,
    constituentComplaintIds: safeParse(group.constituent_complaint_ids || group.constituentComplaintIds),
    endorsedBy: safeParse(group.endorsed_by || group.endorsedBy),
    status: group.status,
    escalationNote: group.escalation_note || group.escalationNote || '',
    createdAt: group.created_at || group.createdAt,
  });

  // Load complaints on mount or session change
  useEffect(() => {
    const loadData = async () => {
      if (!session) {
        setComplaints([]);
        setMergedGroups([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [complaintsData, mergedData] = await Promise.all([
          apiService.getComplaints(),
          apiService.getMergedGroups(),
        ]);
        setComplaints(complaintsData.map(normalizeComplaint));
        setMergedGroups(mergedData.map(normalizeMergedGroup));
      } catch (err) {
        setError(err.message);
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session]);

  const addComplaint = async (payload) => {
    try {
      setError(null);
      const complaintData = {
        id: crypto.randomUUID(),
        status: STATUS.pending,
        visibility: VISIBILITY.private,
        completionPhotoUri: null,
        parentComplaintId: payload.parentComplaintId || null,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      await apiService.createComplaint(complaintData);
      await reload();
      return complaintData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateComplaintStatus = async (id, status, extra = {}) => {
    try {
      setError(null);
      await apiService.updateComplaintStatus(id, status);
      setComplaints((prev) =>
        prev.map((complaint) =>
          complaint.id === id ? { ...complaint, status, ...extra } : complaint
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const completeComplaint = async (id, description, photoUri) => {
    try {
      setError(null);
      await apiService.completeComplaint(id, description, photoUri);
      await reload();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const reload = async () => {
    const [complaintsData, mergedData] = await Promise.all([
      apiService.getComplaints(),
      apiService.getMergedGroups(),
    ]);
    setComplaints(complaintsData.map(normalizeComplaint));
    setMergedGroups(mergedData.map(normalizeMergedGroup));
  };

  const rejectComplaint = async (id, reason) => {
    try {
      setError(null);
      const res = await apiService.rejectComplaint(id, reason);
      // Reload to get the real server state (status may be 'escalated' or 'rejected')
      await reload();
      // Return the raw API response so callers can read res.escalated
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const escalateComplaint = async (id, escalationDescription) => {
    try {
      setError(null);
      await apiService.escalateComplaint(id, escalationDescription);
      setComplaints((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'escalated',
                escalationDescription,
              }
            : item
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const acknowledgeComplaint = async (id) => {
    await updateComplaintStatus(id, 'acknowledged');
  };

  const mergeComplaints = async ({ roomId, category, complaintIds, managerDescription }) => {
    try {
      setError(null);
      const group = {
        id: crypto.randomUUID(),
        roomId,
        category,
        managerDescription,
        constituentComplaintIds: complaintIds,
      };
      await apiService.createMergedGroup(group);
      await reload();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const endorseMerged = async (mergedId, employeeId) => {
    try {
      setError(null);
      await apiService.endorseMergedGroup(mergedId, employeeId);
      await reload();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const escalateMergedComplaint = async (id, escalationNote = '') => {
    try {
      setError(null);
      await apiService.escalateMergedGroup(id, escalationNote);
      setMergedGroups((prev) =>
        prev.map((group) =>
          group.id === id
            ? {
                ...group,
                status: 'escalated',
                escalationNote,
              }
            : group
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const acknowledgeMergedComplaint = async (id) => {
    try {
      setError(null);
      await apiService.acknowledgeMergedGroup(id);
      setMergedGroups((prev) =>
        prev.map((group) =>
          group.id === id ? { ...group, status: 'acknowledged' } : group
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Returns total rejection count across all complaints for a given employee+room+category
  // This is the TOTAL across all their complaints (com1 + com2 + com3...) for that room+category
  const getRejectionCount = (employeeId, roomId, category) =>
    complaints
      .filter(
        (c) =>
          c.employeeId === employeeId &&
          c.roomId === roomId &&
          c.category === category
      )
      .reduce((total, c) => total + (c.rejectionHistory?.length || 0), 0);

  const pendingUnmerged = complaints.filter((complaint) => complaint.status === STATUS.pending && !complaint.mergedIntoId);

  const mergeCandidates = Object.values(
    pendingUnmerged.reduce((acc, complaint) => {
      const key = `${complaint.roomId}__${complaint.category}`;
      if (!acc[key]) acc[key] = { roomId: complaint.roomId, category: complaint.category, complaints: [] };
      acc[key].complaints.push(complaint);
      return acc;
    }, {})
  ).filter((group) => new Set(group.complaints.map((complaint) => complaint.employeeId)).size >= 5);

  const value = useMemo(
    () => ({
      complaints,
      mergedGroups,
      loading,
      error,
      pendingUnmerged,
      mergeCandidates,
      reload,
      addComplaint,
      endorseMerged,
      updateComplaintStatus,
      completeComplaint,
      rejectComplaint,
      escalateComplaint,
      acknowledgeComplaint,
      escalateMergedComplaint,
      acknowledgeMergedComplaint,
      mergeComplaints,
      getRejectionCount,
      status: STATUS,
      visibility: VISIBILITY,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [complaints, mergedGroups, loading, error],
  );

  return <ComplaintContext.Provider value={value}>{children}</ComplaintContext.Provider>;
}

export function useComplaints() {
  return useContext(ComplaintContext);
}
