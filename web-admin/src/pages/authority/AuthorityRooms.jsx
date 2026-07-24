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

  // Compute unique floors list
  const allFloors = Array.from(new Set([
    ...managers.map(m => m.floor_number).filter(f => f !== null && f !== undefined),
    ...rooms.map(r => r.floor_number || '0'),
    ...customFloors
  ])).sort((a, b) => {
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
    if (allFloors.length > 0 && !allFloors.includes(selectedFloor)) {
      setSelectedFloor(allFloors[0]);
    }
  }, [rooms, managers, customFloors]);

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
      setSelectedFloor(res.floorNumber);
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
    setEditingFloor(room.floor_number || '0');
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Overview & Add Form Header */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Manage Room & Floor Inventory</h2>
        <p className="text-sm text-slate-500 mb-6">
          Add floor managers and assign rooms per floor. Each floor has a dedicated Floor Manager with auto-generated credentials.
        </p>

        <div className="flex flex-col gap-4 mb-6">
          {/* Floor selection and new floor creation */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                Select Floor
              </label>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 font-medium"
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  disabled={submitting}
                >
                  {allFloors.length === 0 ? (
                    <option value="0">Ground Floor (No Floors Created Yet)</option>
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
                  className="rounded-lg border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 text-sm font-bold text-indigo-700 shadow-sm transition flex items-center gap-1"
                  title="Add next floor in ascending order"
                >
                  ➕ Add Floor
                </button>
              </div>
            </div>

            {/* Room creation */}
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                Room Number
              </label>
              <form onSubmit={handleAddRoom} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                  placeholder="e.g. 101, B-12"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  disabled={submitting}
                  required
                />
                <button
                  type="submit"
                  disabled={submitting || !newRoomNumber.trim()}
                  className="rounded-lg bg-slate-900 hover:bg-slate-800 px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : '➕ Add Room'}
                </button>
              </form>
            </div>
          </div>

          {/* Add Floor & Floor Manager Form */}
          {showAddFloorInput && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-5 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-indigo-950">
                    Create Next Floor: <span className="text-indigo-600 font-extrabold">{formatFloorName(nextFloorNum)}</span>
                  </h4>
                  <p className="text-xs text-indigo-700">Assign a dedicated Floor Manager for this floor.</p>
                </div>
                <span className="text-xs font-mono bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full">
                  Floor {nextFloorNum}
                </span>
              </div>

              <form onSubmit={handleCreateFloorManager} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Floor Manager Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      placeholder="e.g. Robert Fox"
                      value={mgrName}
                      onChange={(e) => setMgrName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Floor Manager Email (@xyzcompany.com) *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      placeholder="e.g. robert@xyzcompany.com"
                      value={mgrEmail}
                      onChange={(e) => setMgrEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-500 bg-white/70 p-2.5 rounded-lg border border-indigo-100">
                  ℹ️ Manager ID will be auto-generated starting with <code className="font-bold text-indigo-700">man[8 digits]</code>. Default password is <code className="font-bold text-indigo-700">Welcome123$</code>.
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddFloorInput(false);
                      setMgrName('');
                      setMgrEmail('');
                    }}
                    className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingFloorManager || !mgrName.trim() || !mgrEmail.trim()}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white transition disabled:opacity-50"
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
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-slate-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-800">
            Active Rooms ({rooms.length})
          </h3>
          <input
            type="text"
            className="w-full sm:w-64 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-800"
            placeholder="Search rooms or floors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredRooms.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="text-sm">No rooms match your search.</p>
          </div>
        ) : (
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {filteredRooms.map((room) => {
              const isEditing = editingId === room.id;
              const isConfirmingDelete = deletingId === room.id;

              return (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 pr-4">
                    {isEditing ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          className="rounded border border-slate-300 px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
                          value={editingNumber}
                          onChange={(e) => setEditingNumber(e.target.value)}
                          autoFocus
                          placeholder="Room Number"
                        />
                        <select
                          className="rounded border border-slate-300 px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
                          value={editingFloor}
                          onChange={(e) => setEditingFloor(e.target.value)}
                        >
                          {allFloors.map(f => (
                            <option key={f} value={f}>{formatFloorName(f)}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-base">
                          Room {room.room_number}
                        </span>
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                          {formatFloorName(room.floor_number)}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
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
