import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('employee');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    try {
      const session = await login({ role, userId: userId.trim(), password });
      let destination = '/';
      if (session.role === 'employee') destination = '/employee/raise';
      else if (session.role === 'manager') destination = '/manager/pending';
      else if (session.role === 'authority') destination = '/authority/overview';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl border bg-white p-6 shadow">
        <h1 data-testid="loginTitle" className="mb-1 text-2xl font-semibold text-slate-800">FacilityDesk</h1>
        <p data-testid="loginSubtitle" className="mb-4 text-sm text-slate-500">Governed Facility-Issue Management System</p>

        <label className="mb-1 block text-sm font-medium">Role</label>
        <select data-testid="rolePicker" className="mb-3 w-full rounded border px-3 py-2" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="authority">Authority</option>
        </select>

        <p className="mb-3 text-xs text-slate-500">
          {role === 'manager' ? 'System: ID "manager", password "man123"' : role === 'authority' ? 'System: ID "auth", password "auth123"' : 'New employees can register below'}
        </p>
        <label className="mb-1 block text-sm font-medium">User ID</label>
        <input data-testid="userId" className="mb-3 w-full rounded border px-3 py-2" value={userId} onChange={(e) => setUserId(e.target.value)} required />
        <label className="mb-1 block text-sm font-medium">Password</label>
        <input data-testid="password" type="password" className="mb-3 w-full rounded border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error ? <p data-testid="loginError" className="mb-3 text-sm text-red-600">{error}</p> : null}
        <button data-testid="loginButton" type="submit" className="w-full rounded bg-slate-900 py-2 text-white">Login</button>

        {role === 'employee' ? (
          <p className="mt-3 text-sm text-slate-600">
            New employee? <Link data-testid="registerLink" to="/register" className="text-blue-700">Register</Link>
          </p>
        ) : null}
      </form>
    </div>
  );
}
