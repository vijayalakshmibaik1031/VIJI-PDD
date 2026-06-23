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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 sm:px-6 py-12">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl text-white">
        <h1 data-testid="registerTitle" className="mb-1 text-3xl font-extrabold text-white tracking-tight">Employee Registration</h1>
        <p className="mb-6 text-sm text-slate-400">Manager and authority use fixed system accounts.</p>
        
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">Name</label>
            <input
              data-testid="registerName"
              className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">Employee ID</label>
            <input
              data-testid="registerEmployeeId"
              className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200"
              placeholder="Employee ID"
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">Password</label>
            <input
              data-testid="registerPassword"
              type="password"
              className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        {error ? <p data-testid="registerError" className="mt-4 text-sm text-red-400 font-semibold">{error}</p> : null}
        
        <button
          data-testid="registerSubmit"
          type="submit"
          className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-500 hover:shadow-indigo-500/20 hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
        
        <p className="mt-6 text-sm text-slate-400 text-center">
          Back to <Link data-testid="backToLoginLink" to="/" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">Login</Link>
        </p>
      </form>
    </div>
  );
}
