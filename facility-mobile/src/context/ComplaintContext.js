import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { apiCall } from '../config/api';
import { useAuth } from './AuthContext';

const ComplaintContext = createContext();

export const ComplaintProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [mergedGroups, setMergedGroups] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetchers ────────────────────────────────────────────────────────────

  const fetchComplaints = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await apiCall('/complaints', { method: 'GET' }, token);
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const fetchMergedGroups = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiCall('/merged-groups', { method: 'GET' }, token);
      setMergedGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching merged groups:', err);
    }
  }, [token]);

  const fetchRooms = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiCall('/rooms', { method: 'GET' }, token);
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  }, [token]);

  const fetchEmployees = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiCall('/employees', { method: 'GET' }, token);
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  }, [token]);

  const fetchManagers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiCall('/managers', { method: 'GET' }, token);
      setManagers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching managers:', err);
    }
  }, [token]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchComplaints(),
      fetchMergedGroups(),
      fetchRooms(),
      fetchEmployees(),
      fetchManagers(),
    ]);
  }, [fetchComplaints, fetchMergedGroups, fetchRooms, fetchEmployees, fetchManagers]);

  // Silent automatic background sync polling (runs every 3 seconds)
  useEffect(() => {
    if (!token) return;
    refreshAll();
    const pollInterval = setInterval(() => {
      refreshAll();
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [token, refreshAll]);

  // ── Complaint Actions ────────────────────────────────────────────────────

  const createComplaint = async (complaintData) => {
    setLoading(true);
    try {
      const payload = {
        id: complaintData.id || `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ...complaintData,
      };
      const data = await apiCall('/complaints', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, token);
      await fetchComplaints();
      setLoading(false);
      return data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const updateComplaintStatus = async (id, status) => {
    try {
      const data = await apiCall(`/complaints/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }, token);
      await fetchComplaints();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const completeComplaint = async (id, description, photoUri) => {
    try {
      const data = await apiCall(`/complaints/${id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({ completionDescription: description, completionPhotoUri: photoUri }),
      }, token);
      await fetchComplaints();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const rejectComplaint = async (id, reason) => {
    try {
      const data = await apiCall(`/complaints/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }, token);
      await fetchComplaints();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const escalateComplaint = async (id, reason) => {
    try {
      const data = await apiCall(`/complaints/${id}/escalate`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }, token);
      await fetchComplaints();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const raiseToPublic = async (id) => {
    try {
      const data = await apiCall(`/complaints/${id}/raise-to-public`, {
        method: 'PATCH',
      }, token);
      await fetchComplaints();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const endorseComplaint = async (id, employeeId) => {
    try {
      const data = await apiCall(`/complaints/${id}/endorse`, {
        method: 'POST',
        body: JSON.stringify({ employeeId }),
      }, token);
      await fetchComplaints();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const recomplain = async (employeeId, roomId, category, complaintId) => {
    try {
      const data = await apiCall('/complaints/mark-recomplained', {
        method: 'POST',
        body: JSON.stringify({ employeeId, roomId, category, complaintId }),
      }, token);
      await fetchComplaints();
      return data;
    } catch (err) {
      throw err;
    }
  };

  // ── Merged Group Actions ─────────────────────────────────────────────────

  const createMergedGroup = async (mergedGroupData) => {
    try {
      const data = await apiCall('/merged-groups', {
        method: 'POST',
        body: JSON.stringify({
          ...mergedGroupData,
          complaintIds: mergedGroupData.complaintIds || mergedGroupData.constituentComplaintIds,
        }),
      }, token);
      await Promise.all([fetchMergedGroups(), fetchComplaints()]);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const endorseMergedGroup = async (id, employeeId) => {
    try {
      const data = await apiCall(`/merged-groups/${id}/endorse`, {
        method: 'POST',
        body: JSON.stringify({ employeeId }),
      }, token);
      await fetchMergedGroups();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const acknowledgeMergedGroup = async (id) => {
    try {
      const data = await apiCall(`/merged-groups/${id}/acknowledge`, {
        method: 'PATCH',
      }, token);
      await Promise.all([fetchMergedGroups(), fetchComplaints()]);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const completeMergedGroup = async (id, description, photoUri) => {
    try {
      const data = await apiCall(`/merged-groups/${id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({ completionDescription: description, completionPhotoUri: photoUri }),
      }, token);
      await Promise.all([fetchMergedGroups(), fetchComplaints()]);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const escalateMergedGroup = async (id, escalationNote) => {
    try {
      const data = await apiCall(`/merged-groups/${id}/escalate`, {
        method: 'PATCH',
        body: JSON.stringify({ escalationNote }),
      }, token);
      await fetchMergedGroups();
      return data;
    } catch (err) {
      throw err;
    }
  };

  // ── Rooms CRUD ───────────────────────────────────────────────────────────

  const createRoom = async (roomNumber, floorNumber) => {
    try {
      const data = await apiCall('/rooms', {
        method: 'POST',
        body: JSON.stringify({ roomNumber, floorNumber }),
      }, token);
      await fetchRooms();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const updateRoom = async (id, roomNumber, floorNumber) => {
    try {
      const data = await apiCall(`/rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ roomNumber, floorNumber }),
      }, token);
      await fetchRooms();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const deleteRoom = async (id) => {
    try {
      const data = await apiCall(`/rooms/${id}`, {
        method: 'DELETE',
      }, token);
      await fetchRooms();
      return data;
    } catch (err) {
      throw err;
    }
  };

  // ── User / Account CRUD ──────────────────────────────────────────────────

  const createEmployee = async (id, name, email) => {
    try {
      const data = await apiCall('/employees', {
        method: 'POST',
        body: JSON.stringify({ id, name, email }),
      }, token);
      await fetchEmployees();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const updateEmployee = async (id, name, email) => {
    try {
      const data = await apiCall(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, email }),
      }, token);
      await fetchEmployees();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const deleteEmployee = async (id) => {
    try {
      const data = await apiCall(`/employees/${id}`, {
        method: 'DELETE',
      }, token);
      await fetchEmployees();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const createManager = async (id, name, email) => {
    try {
      const data = await apiCall('/managers', {
        method: 'POST',
        body: JSON.stringify({ id, name, email }),
      }, token);
      await fetchManagers();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const updateManager = async (id, name, email) => {
    try {
      const data = await apiCall(`/managers/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, email }),
      }, token);
      await fetchManagers();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const deleteManager = async (id) => {
    try {
      const data = await apiCall(`/managers/${id}`, {
        method: 'DELETE',
      }, token);
      await fetchManagers();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const resetFirstPassword = async (role, userId, email, newPassword) => {
    try {
      const data = await apiCall('/auth/reset-first-password', {
        method: 'POST',
        body: JSON.stringify({ role, userId, email, newPassword }),
      });
      return data;
    } catch (err) {
      throw err;
    }
  };

  const updateEmployeeProfile = async (payload) => {
    try {
      const data = await apiCall('/employees/update-profile', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, token);
      return data;
    } catch (err) {
      throw err;
    }
  };

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        mergedGroups,
        rooms,
        employees,
        managers,
        users: employees,
        loading,
        error,
        fetchComplaints,
        fetchMergedGroups,
        fetchRooms,
        fetchEmployees,
        fetchManagers,
        refreshAll,
        createComplaint,
        updateComplaintStatus,
        completeComplaint,
        rejectComplaint,
        escalateComplaint,
        raiseToPublic,
        endorseComplaint,
        recomplain,
        createMergedGroup,
        endorseMergedGroup,
        acknowledgeMergedGroup,
        completeMergedGroup,
        escalateMergedGroup,
        createRoom,
        updateRoom,
        deleteRoom,
        createEmployee,
        updateEmployee,
        deleteEmployee,
        createManager,
        updateManager,
        deleteManager,
        resetFirstPassword,
        updateEmployeeProfile,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => useContext(ComplaintContext);
