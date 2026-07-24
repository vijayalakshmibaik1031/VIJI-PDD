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
  const { rooms, createRoom, updateRoom, deleteRoom } = useComplaints();
  const { showToast } = useToast();

  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('0');
  const [customFloors, setCustomFloors] = useState([]);
  const [showAddFloorInput, setShowAddFloorInput] = useState(false);

  const [managers, setManagers] = useState([]);
  const [mgrName, setMgrName] = useState('');
  const [mgrEmail, setMgrEmail] = useState('');
  const [creatingFloorManager, setCreatingFloorManager] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingNumber, setEditingNumber] = useState('');
  const [editingFloor, setEditingFloor] = useState('0');
  const [deletingId, setDeletingId] = useState(null);
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

    setCreatingFloorManager(true);
    try {
      const res = await apiService.createFloorManager(mgrName.trim(), mgrEmail.trim().toLowerCase());
      showToast(`Floor ${formatFloorName(res.floorNumber)} created! Assigned Manager ID: ${res.managerId}`);
      await fetchManagersList();
      setSelectedFloor(String(res.floorNumber));
      setMgrName('');
      setMgrEmail('');
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            {filteredRooms.map((room) => {
              const isEditing = editingId === room.id;
              const isConfirmingDelete = deletingId === room.id;

              return (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex-1 pr-4">
                    {isEditing ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white w-32 focus:outline-none focus:border-indigo-500"
                          value={editingNumber}
                          onChange={(e) => setEditingNumber(e.target.value)}
                          autoFocus
                          placeholder="Room Number"
                        />
                        <select
                          className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                          value={editingFloor}
                          onChange={(e) => setEditingFloor(e.target.value)}
                        >
                          {allFloors.map(f => (
                            <option key={f} value={f}>{formatFloorName(f)}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-white text-base">
                          Room {room.room_number}
                        </span>
                        <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-500/30 px-3 py-0.5 rounded-full font-bold">
                          {formatFloorName(room.floor_number)}
                        </span>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                          ID: {room.id}
                        </span>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400 mt-1">
                      Created: {new Date(room.created_at || room.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(room.id)}
                          disabled={!editingNumber.trim()}
                          className="rounded bg-teal-600 hover:bg-teal-700 px-3 py-1 text-xs font-medium text-white transition disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded border border-slate-300 hover:bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition"
                        >
                          Cancel
                        </button>
                      </>
                    ) : isConfirmingDelete ? (
                      <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded p-1.5">
                        <span className="text-xs text-red-700 font-medium px-1">Are you sure?</span>
                        <button
                          onClick={() => handleDeleteRoom(room.id, room.room_number)}
                          className="rounded bg-red-600 hover:bg-red-700 px-2.5 py-0.5 text-xs font-semibold text-white transition"
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="rounded bg-slate-200 hover:bg-slate-300 px-2 py-0.5 text-xs font-medium text-slate-700 transition"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(room)}
                          className="rounded border border-slate-300 hover:bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingId(room.id)}
                          className="rounded border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 text-xs font-medium transition"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
