import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { registerEmployee, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerEmployee({ name: name.trim(), id: id.trim(), password });
      const session = await login({ role: 'employee', userId: id.trim(), password });
      if (session.role === 'employee') navigate('/employee/raise');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl border bg-white p-6 shadow">
        <h1 className="mb-1 text-2xl font-semibold text-slate-800">Employee Registration</h1>
        <p className="mb-4 text-sm text-slate-500">Manager and authority use fixed system accounts.</p>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <input className="mb-3 w-full rounded border px-3 py-2" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} required />
        <label className="mb-1 block text-sm font-medium">Employee ID</label>
        <input className="mb-3 w-full rounded border px-3 py-2" placeholder="Employee ID" value={id} onChange={(e) => setId(e.target.value)} disabled={loading} required />
        <label className="mb-1 block text-sm font-medium">Password</label>
        <input type="password" className="mb-3 w-full rounded border px-3 py-2" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required />
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="w-full rounded bg-slate-900 py-2 text-white disabled:opacity-50" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
        <p className="mt-3 text-sm text-slate-600">Back to <Link to="/" className="text-blue-700">Login</Link></p>
      </form>
    </div>
  );
}
