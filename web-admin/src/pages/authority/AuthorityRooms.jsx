import { useState, useEffect } from 'react';
import { useComplaints } from '../../context/ComplaintContext';
import { useToast } from '../../context/ToastContext';
import { apiService } from '../../utils/apiService';

export const formatFloorName = (floorNum) => {
  if (floorNum === undefined || floorNum === null || floorNum === '') return 'N/A';
  const num = parseInt(floorNum, 10);
  if (isNaN(num)) return `Floor ${floorNum}`;
  if (num === 0) return 'Ground Floor';
  if (num === 1) return '1st Floor';
  if (num === 2) return '2nd Floor';
  if (num === 3) return '3rd Floor';
  return `${num}th Floor`;
};

export default function AuthorityRooms() {
  const { rooms, createRoom, updateRoom, deleteRoom, reload } = useComplaints();
  const { showToast } = useToast();

  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('0');
  const [customFloors, setCustomFloors] = useState([]);
  const [showAddFloorInput, setShowAddFloorInput] = useState(false);

  const [managers, setManagers] = useState([]);
  const [mgrName, setMgrName] = useState('');
  const [mgrEmail, setMgrEmail] = useState('');
  const [numRooms, setNumRooms] = useState('5');
  const [creatingFloorManager, setCreatingFloorManager] = useState(false);
  const [history, setHistory] = useState([]);

  const [editingLimitFloor, setEditingLimitFloor] = useState(null);
  const [newLimitValue, setNewLimitValue] = useState('');
  const [selectedRoomIdsToDelete, setSelectedRoomIdsToDelete] = useState([]);

  const fetchHistory = async () => {
    try {
      const data = await apiService.getFloorManagerHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const [editingId, setEditingId] = useState(null);
  const [editingNumber, setEditingNumber] = useState('');
  const [editingFloor, setEditingFloor] = useState('0');
  const [deletingId, setDeletingId] = useState(null);

  const handleSaveFloorLimit = async () => {
    const val = parseInt(newLimitValue, 10);
    if (isNaN(val) || val < 1 || val > 20) {
      showToast('New room limit must be between 1 and 20');
      return;
    }

    try {
      await apiService.updateFloorLimit(editingLimitFloor, val, selectedRoomIdsToDelete);
      showToast(`Floor limit updated successfully`);
      setEditingLimitFloor(null);
      await fetchManagersList();
      await fetchHistory();
      if (reload) await reload();
    } catch (err) {
      showToast(err.message || 'Failed to update floor limit');
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchManagersList = async () => {
    try {
      const data = await apiService.getManagers();
      setManagers(data);
    } catch (err) {
      console.error('Failed to load managers', err);
    }
  };

  useEffect(() => {
    fetchManagersList();
    fetchHistory();
  }, []);

  // Compute unique floors list strictly from assigned floor managers
  const floorManagers = managers.filter(m => m.floor_number !== null && m.floor_number !== undefined && m.floor_number !== '');
  const allFloors = Array.from(new Set(floorManagers.map(m => String(m.floor_number)))).sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  // Next ascending floor number
  const nextFloorNum = (() => {
    const validFloors = allFloors.map(f => parseInt(f, 10)).filter(n => !isNaN(n));
    if (validFloors.length === 0) return 0;
    return Math.max(...validFloors) + 1;
  })();

  // Initialize selectedFloor default
  useEffect(() => {
    if (allFloors.length > 0) {
      if (!allFloors.includes(selectedFloor)) {
        setSelectedFloor(allFloors[0]);
      }
    } else {
      setSelectedFloor('');
    }
  }, [managers, customFloors]);

  const handleCreateFloorManager = async (e) => {
    e.preventDefault();
    if (!mgrName.trim() || !mgrEmail.trim()) return;
    if (!mgrEmail.trim().toLowerCase().endsWith('@xyzcompany.com')) {
      showToast('Email must end with @xyzcompany.com');
      return;
    }
    const val = parseInt(numRooms, 10);
    if (isNaN(val) || val < 1 || val > 20) {
      showToast('Number of rooms must be between 1 and 20');
      return;
    }

    setCreatingFloorManager(true);
    try {
      const res = await apiService.createFloorManager(mgrName.trim(), mgrEmail.trim().toLowerCase(), val);
      showToast(`Floor ${formatFloorName(res.floorNumber)} created with ${val} rooms! Assigned Manager ID: ${res.managerId}`);
      await fetchManagersList();
      await fetchHistory();
      if (reload) await reload();
      setSelectedFloor(String(res.floorNumber));
      setMgrName('');
      setMgrEmail('');
      setNumRooms('5');
      setShowAddFloorInput(false);
    } catch (err) {
      showToast(err.message || 'Failed to create floor manager');
    } finally {
      setCreatingFloorManager(false);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (allFloors.length === 0 || !selectedFloor) {
      showToast('Please create a floor with a Floor Manager first!');
      return;
    }
    if (!newRoomNumber.trim()) return;

    const normalized = newRoomNumber.trim();
    
    // Client side duplicate check
    const duplicate = rooms.some(
      (r) => r.room_number.toLowerCase() === normalized.toLowerCase()
    );
    if (duplicate) {
      showToast('Room number already exists');
      return;
    }

    // Find the floor manager's room limit
    const mgr = managers.find(m => String(m.floor_number) === String(selectedFloor));
    if (mgr && mgr.room_limit > 0) {
      const currentRoomsOnFloor = rooms.filter(r => String(r.floor_number) === String(selectedFloor)).length;
      if (currentRoomsOnFloor >= mgr.room_limit) {
        showToast(`Cannot create room: Limit of ${mgr.room_limit} rooms reached for this floor.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await createRoom(normalized, selectedFloor);
      showToast(`Room ${normalized} added to ${formatFloorName(selectedFloor)}`);
      setNewRoomNumber('');
    } catch (err) {
      showToast(err.message || 'Failed to add room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (room) => {
    setEditingId(room.id);
    setEditingNumber(room.room_number);
    setEditingFloor(room.floor_number || (allFloors[0] || '0'));
  };

  const handleSaveEdit = async (id) => {
    if (!editingNumber.trim()) return;
    const normalizedRoom = editingNumber.trim();
    const normalizedFloor = editingFloor.trim();

    // Client side duplicate check (excluding itself)
    const duplicate = rooms.some(
      (r) => r.id !== id && r.room_number.toLowerCase() === normalizedRoom.toLowerCase()
    );
    if (duplicate) {
      showToast('Another room already has this number');
      return;
    }

    try {
      await updateRoom(id, normalizedRoom, normalizedFloor);
      showToast(`Room updated successfully`);
      setEditingId(null);
      setEditingNumber('');
    } catch (err) {
      showToast(err.message || 'Failed to update room');
    }
  };

  const handleDeleteRoom = async (id, number) => {
    try {
      await deleteRoom(id);
      showToast(`Room ${number} deleted`);
      setDeletingId(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete room');
    }
  };

  const filteredRooms = rooms.filter((r) =>
    r.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.floor_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    formatFloorName(r.floor_number).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-white">
      {/* Overview & Add Form Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
        <h2 className="text-xl font-extrabold text-white mb-2 tracking-tight">Manage Room & Floor Inventory</h2>
        <p className="text-sm text-slate-400 mb-6">
          Add floor managers to create new floors in ascending order. Assign room numbers per floor.
        </p>

        <div className="flex flex-col gap-4 mb-6">
          {/* Floor selection and new floor creation */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider pl-1">
                Select Floor
              </label>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-xl border border-slate-700 px-3.5 py-2.5 text-sm bg-slate-800 text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  disabled={submitting || allFloors.length === 0}
                >
                  {allFloors.length === 0 ? (
                    <option value="">No Floors Created Yet (Click + Add Floor)</option>
                  ) : (
                    allFloors.map(f => {
                      const mgr = managers.find(m => String(m.floor_number) === String(f));
                      return (
                        <option key={f} value={f}>
                          {formatFloorName(f)} {mgr ? `(${mgr.name})` : ''}
                        </option>
                      );
                    })
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddFloorInput(!showAddFloorInput)}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition duration-200 flex items-center gap-1.5 shrink-0"
                  title="Add next floor in ascending order"
                >
                  ➕ Add Floor
                </button>
              </div>
            </div>

            {/* Room creation */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider pl-1">
                Room Number
              </label>
              <form onSubmit={handleAddRoom} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                  placeholder={allFloors.length === 0 ? "Create a floor first" : "e.g. 101, B-12"}
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  disabled={submitting || allFloors.length === 0}
                  required
                />
                <button
                  type="submit"
                  disabled={submitting || !newRoomNumber.trim() || allFloors.length === 0}
                  className="rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/20 transition duration-200 disabled:opacity-40"
                >
                  {submitting ? 'Adding...' : '➕ Add Room'}
                </button>
              </form>
            </div>
          </div>

          {/* Warning banner when no floors exist */}
          {allFloors.length === 0 && !showAddFloorInput && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-xs font-semibold text-amber-300 flex items-center gap-2">
              ⚠️ No floors created yet. Click <span className="underline font-bold">+ Add Floor</span> above to create the Ground Floor and assign its Floor Manager!
            </div>
          )}

          {/* Add Floor & Floor Manager Form */}
          {showAddFloorInput && (
            <div className="rounded-2xl border border-indigo-500/30 bg-slate-950/90 p-6 flex flex-col gap-4 shadow-2xl transition-all">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-base font-extrabold text-white">
                    Create Next Floor: <span className="text-indigo-400 font-black">{formatFloorName(nextFloorNum)}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Enter Floor Manager credentials to generate this floor.</p>
                </div>
                <span className="text-xs font-mono font-bold bg-indigo-950 border border-indigo-500/40 text-indigo-300 px-3 py-1 rounded-full">
                  Floor {nextFloorNum}
                </span>
              </div>

              <form onSubmit={handleCreateFloorManager} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Floor Manager Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                      placeholder="e.g. Robert Fox"
                      value={mgrName}
                      onChange={(e) => setMgrName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Floor Manager Email (@xyzcompany.com) *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                      placeholder="e.g. robert@xyzcompany.com"
                      value={mgrEmail}
                      onChange={(e) => setMgrEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Number of Rooms (Max: 20) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="20"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                      placeholder="e.g. 5"
                      value={numRooms}
                      onChange={(e) => setNumRooms(e.target.value)}
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
                  ℹ️ Manager ID will be auto-generated starting with <code className="font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">man[8 digits]</code>. Default password is <code className="font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">Welcome123$</code>.
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddFloorInput(false);
                      setMgrName('');
                      setMgrEmail('');
                      setNumRooms('5');
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingFloorManager || !mgrName.trim() || !mgrEmail.trim()}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white transition disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                  >
                    {creatingFloorManager ? 'Generating...' : `Create ${formatFloorName(nextFloorNum)} & Manager`}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Room list and search */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden backdrop-blur-md">
        <div className="border-b border-slate-800 bg-slate-950/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-extrabold text-white text-base">
            Active Rooms ({rooms.length})
          </h3>
          <input
            type="text"
            className="w-full sm:w-64 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
            placeholder="Search rooms or floors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredRooms.length === 0 ? (
          <div className="p-10 text-center text-slate-500 font-medium">
            <p className="text-sm">No rooms found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
            {(() => {
              // Sort the unique floors in ascending order
              const uniqueFloors = Array.from(new Set(filteredRooms.map(r => String(r.floor_number)))).sort((a, b) => {
                const numA = parseInt(a, 10);
                const numB = parseInt(b, 10);
                if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                return a.localeCompare(b);
              });

              return uniqueFloors.map(floorNum => {
                const floorRooms = filteredRooms
                  .filter(r => String(r.floor_number) === String(floorNum))
                  .sort((a, b) => (a.id || 0) - (b.id || 0)); // created order (id ASC)

                const mgr = managers.find(m => String(m.floor_number) === String(floorNum));

                return (
                  <div key={floorNum} className="p-5">
                    <h4 className="text-sm font-black text-indigo-400 mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span>🏢 {formatFloorName(floorNum)} {mgr ? `(${mgr.name})` : ''}</span>
                        <span className="text-xs text-slate-500 font-normal bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Limit: {mgr ? mgr.room_limit : 5}</span>
                        <button
                          onClick={() => {
                            setEditingLimitFloor(floorNum);
                            setNewLimitValue(String(mgr ? mgr.room_limit : 5));
                            setSelectedRoomIdsToDelete([]);
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-black hover:underline"
                        >
                          Edit Limit
                        </button>
                      </span>
                      <span className="text-xs text-slate-500 font-normal">{floorRooms.length} rooms</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {floorRooms.map(room => {
                        const isEditing = editingId === room.id;
                        const isConfirmingDelete = deletingId === room.id;
                        return (
                          <div key={room.id} className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between gap-2 shadow-inner">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 w-full">
                                <input
                                  type="text"
                                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
                                  value={editingNumber}
                                  onChange={(e) => setEditingNumber(e.target.value)}
                                  autoFocus
                                />
                                <button className="text-emerald-400 text-xs font-bold" onClick={() => handleSaveEdit(room.id)}>Save</button>
                                <button className="text-slate-400 text-xs font-bold" onClick={() => setEditingId(null)}>Cancel</button>
                              </div>
                            ) : isConfirmingDelete ? (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs text-rose-400 font-semibold">Delete Room {room.room_number}?</span>
                                <div className="flex gap-2">
                                  <button className="text-rose-500 text-xs font-black" onClick={() => handleDeleteRoom(room.id, room.room_number)}>Yes</button>
                                  <button className="text-slate-400 text-xs font-semibold" onClick={() => setDeletingId(null)}>No</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <span className="text-sm font-bold text-white">Room {room.room_number}</span>
                                  <div className="text-[9px] text-slate-500 mt-0.5">ID: {room.id} | {new Date(room.created_at || room.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </div>
                                <div className="flex gap-2">
                                  <button className="text-indigo-400 hover:text-indigo-300 text-xs font-bold" onClick={() => handleStartEdit(room)}>Edit</button>
                                  <button className="text-rose-500 hover:text-rose-400 text-xs font-bold" onClick={() => setDeletingId(room.id)}>Delete</button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Floor & Room History Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden backdrop-blur-md">
        <div className="border-b border-slate-800 bg-slate-950/80 p-4">
          <h3 className="font-extrabold text-white text-base">
            Floor Manager & Room History
          </h3>
          <p className="text-xs text-slate-400 mt-1">Audit log of creation and deletion of floors, manager credentials, and allocated rooms.</p>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-medium">
            <p className="text-sm">No floor history recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-[400px] overflow-y-auto">
            {history.map((item) => {
              const roomsList = Array.isArray(item.rooms_details) ? item.rooms_details : JSON.parse(item.rooms_details || '[]');
              return (
                <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/20">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.action === 'created' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                        {item.action.toUpperCase()}
                      </span>
                      <span className="font-bold text-sm text-white">
                        Floor {item.floor_number} ({formatFloorName(item.floor_number)})
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Manager: <span className="text-white font-medium">{item.manager_name}</span> ({item.manager_email})
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Time: {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="w-full md:w-auto min-w-[200px]">
                    {/* Collapsible/Dropdown for Rooms details */}
                    <div className="text-xs bg-slate-950/60 border border-slate-800/85 rounded-xl p-2">
                      <div className="font-bold text-slate-400 mb-1 flex justify-between">
                        <span>Rooms Allocated ({roomsList.length}):</span>
                      </div>
                      {roomsList.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {roomsList.map((rm, idx) => (
                            <span key={idx} className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded">
                              {rm}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">None</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingLimitFloor && (() => {
        const mgr = managers.find(m => String(m.floor_number) === String(editingLimitFloor));
        const floorRooms = rooms.filter(r => String(r.floor_number) === String(editingLimitFloor)).sort((a,b) => (a.id || 0) - (b.id || 0));
        const currentLimit = mgr ? (mgr.room_limit || 0) : 5;
        const currentCount = floorRooms.length;

        const targetLimit = parseInt(newLimitValue, 10) || 0;
        const excessCount = currentCount - targetLimit;
        const isDecrease = excessCount > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <h3 className="text-lg font-black text-white mb-2">
                Edit Room Limit for {formatFloorName(editingLimitFloor)}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Current Limit: <span className="text-indigo-400 font-bold">{currentLimit}</span> | Active Rooms: <span className="text-emerald-400 font-bold">{currentCount}</span>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 font-sans">New Room Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="w-full rounded-xl border border-slate-700 bg-slate-850 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
                    value={newLimitValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewLimitValue(val);
                      const limitVal = parseInt(val, 10) || 0;
                      const reqCount = currentCount - limitVal;
                      if (reqCount > 0) {
                        // Pre-select latest created rooms by default
                        const latestRooms = [...floorRooms].reverse().slice(0, reqCount);
                        setSelectedRoomIdsToDelete(latestRooms.map(r => r.id));
                      } else {
                        setSelectedRoomIdsToDelete([]);
                      }
                    }}
                  />
                </div>

                {isDecrease && (
                  <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-3.5 space-y-2">
                    <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      ⚠️ Decreasing limit below active count
                    </div>
                    <p className="text-[11px] text-slate-300">
                      You must select exactly <span className="font-bold text-white bg-rose-900/60 px-1.5 py-0.5 rounded">{excessCount}</span> room(s) to delete to accommodate the new limit.
                    </p>

                    <div className="max-h-[160px] overflow-y-auto space-y-1.5 mt-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
                      {floorRooms.map(r => {
                        const isChecked = selectedRoomIdsToDelete.includes(r.id);
                        return (
                          <label key={r.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-800/40 cursor-pointer text-xs">
                            <span className="text-white font-bold">Room {r.room_number}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                let updated = [...selectedRoomIdsToDelete];
                                if (isChecked) {
                                  updated = updated.filter(id => id !== r.id);
                                } else {
                                  updated.push(r.id);
                                }
                                setSelectedRoomIdsToDelete(updated);
                              }}
                              className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                    {selectedRoomIdsToDelete.length !== excessCount && (
                      <p className="text-[10px] text-amber-400 font-semibold mt-1">
                        Please select exactly {excessCount} rooms (Currently selected: {selectedRoomIdsToDelete.length})
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => setEditingLimitFloor(null)}
                  className="rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFloorLimit}
                  disabled={targetLimit < 1 || targetLimit > 20 || (isDecrease && selectedRoomIdsToDelete.length !== excessCount)}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  Save Limit
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
