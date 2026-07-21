import { useState, useEffect } from 'react';
import { apiService } from '../../utils/apiService';

export default function AuthorityUsers() {
  const [activeTab, setActiveTab] = useState('managers'); // 'managers' | 'employees'
  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalType, setModalType] = useState('manager'); // 'manager' | 'employee'
  
  // Form fields
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const [mgrRes, empRes] = await Promise.all([
        apiService.getManagers(),
        apiService.getEmployees(),
      ]);
      setManagers(mgrRes);
      setEmployees(empRes);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.toLowerCase().endsWith('@xyzcompany.com')) {
      setError('Email address must end with @xyzcompany.com.');
      return;
    }

    try {
      if (modalType === 'manager') {
        await apiService.createManager(userId.trim(), name.trim(), email.trim().toLowerCase());
        setSuccess('Manager created successfully (default password: Welcome123$)');
      } else {
        await apiService.createEmployee(userId.trim(), name.trim(), email.trim().toLowerCase());
        setSuccess('Employee created successfully (default password: Welcome123$)');
      }
      fetchUsers();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError(err.message || 'Action failed.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.toLowerCase().endsWith('@xyzcompany.com')) {
      setError('Email address must end with @xyzcompany.com.');
      return;
    }

    try {
      if (modalType === 'manager') {
        await apiService.updateManager(editingUserId, name.trim(), email.trim().toLowerCase());
        setSuccess('Manager updated successfully.');
      } else {
        await apiService.updateEmployee(editingUserId, name.trim(), email.trim().toLowerCase());
        setSuccess('Employee updated successfully.');
      }
      fetchUsers();
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      setError(err.message || 'Update failed.');
    }
  };

  const handleDeleteClick = async () => {
    if (!window.confirm(`Are you sure you want to delete this ${modalType === 'manager' ? 'manager' : 'employee'}? This action cannot be undone.`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      if (modalType === 'manager') {
        await apiService.deleteManager(editingUserId);
        setSuccess('Manager deleted successfully.');
      } else {
        await apiService.deleteEmployee(editingUserId);
        setSuccess('Employee deleted successfully.');
      }
      fetchUsers();
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      setError(err.message || 'Deletion failed.');
    }
  };

  const openAddModal = (type) => {
    setModalType(type);
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (type, user) => {
    setModalType(type);
    setEditingUserId(user.id);
    setName(user.name);
    setEmail(user.email || '');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setUserId('');
    setName('');
    setEmail('');
    setEditingUserId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">User Directory</h2>
          <p className="text-sm text-slate-400 mt-1">Manage system accounts for managers and employees.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openAddModal('manager')}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition duration-200"
          >
            + New Manager
          </button>
          <button
            onClick={() => openAddModal('employee')}
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition duration-200"
          >
            + New Employee
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-sm text-red-400">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-500/20 bg-green-950/30 p-4 text-sm text-green-400">
          ✓ {success}
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-850">
        <button
          onClick={() => setActiveTab('managers')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'managers'
              ? 'border-indigo-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Managers ({managers.length})
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'employees'
              ? 'border-violet-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Employees ({employees.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md">
          <table className="w-full text-left text-sm border-collapse text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Password Hash</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeTab === 'managers' ? (
                managers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-500">No managers found.</td>
                  </tr>
                ) : (
                  managers.map((mgr) => (
                    <tr key={mgr.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-indigo-400">{mgr.id}</td>
                      <td className="px-6 py-4 font-semibold text-white">{mgr.name}</td>
                      <td className="px-6 py-4 text-slate-400">{mgr.email || 'N/A'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 max-w-xs truncate" title={mgr.password}>
                        {mgr.password}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(mgr.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal('manager', mgr)}
                          className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                employees.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-500">No employees found.</td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-violet-400">{emp.id}</td>
                      <td className="px-6 py-4 font-semibold text-white">{emp.name}</td>
                      <td className="px-6 py-4 text-slate-400">{emp.email || 'N/A'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 max-w-xs truncate" title={emp.password}>
                        {emp.password}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(emp.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal('employee', emp)}
                          className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl text-white">
            <h3 className="text-xl font-bold mb-4">
              Add New {modalType === 'manager' ? 'Manager' : 'Employee'}
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  User ID
                </label>
                <input
                  type="text"
                  required
                  placeholder={modalType === 'manager' ? 'e.g. manager2' : 'e.g. emp002'}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email address (@xyzcompany.com)
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@xyzcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div className="text-xs text-slate-500 italic bg-white/5 border border-slate-800 rounded-xl p-3">
                Note: The login password will default to <strong className="text-indigo-400">Welcome123$</strong>. The user will be requested to reset it on their first login.
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl text-white">
            <h3 className="text-xl font-bold mb-4">
              Edit {modalType === 'manager' ? 'Manager' : 'Employee'} (ID: {editingUserId})
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email address (@xyzcompany.com)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="rounded-xl bg-rose-600/90 hover:bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition duration-200"
                >
                  Delete
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
                  >
                    Update
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
