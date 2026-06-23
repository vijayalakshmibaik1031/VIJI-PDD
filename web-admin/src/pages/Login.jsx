import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const params = useParams();

  const initialRole = params.role || 'employee';
  const [role] = useState(initialRole);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
  }, [role]);

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
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 sm:px-6 py-12">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl text-white">
        <h1 className="mb-1 text-3xl font-extrabold text-white tracking-tight">FacilityVoice</h1>
        <p className="mb-6 text-sm text-slate-400">Governed Facility-Issue Management System</p>

        <div className="mb-4 bg-white/5 border border-white/5 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Signing in as</div>
          <div className="font-bold text-indigo-400 text-lg">{role.charAt(0).toUpperCase() + role.slice(1)}</div>
        </div>

        <div className="mb-6 text-xs text-slate-300 bg-white/5 border border-white/5 rounded-xl p-4 leading-relaxed">
          {role === 'manager' ? (
            <span>System account: ID <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono">manager</code>, password <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono">man123</code></span>
          ) : role === 'authority' ? (
            <span>System account: ID <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono">auth</code>, password <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono">auth123</code></span>
          ) : (
            <span>New employees can register from this page using their ID.</span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">User ID</label>
            <input
              data-testid="userId"
              className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200"
              placeholder="Enter User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">Password</label>
            <input
              data-testid="password"
              type="password"
              className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error ? <p data-testid="loginError" className="mt-4 text-sm text-red-400 font-semibold">{error}</p> : null}
        
        <button
          data-testid="loginButton"
          type="submit"
          className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-500 hover:shadow-indigo-500/20 hover:shadow-lg transition-all duration-200"
        >
          Login
        </button>

        {role === 'employee' ? (
          <p className="mt-6 text-sm text-slate-400 text-center">
            New employee? <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">Register</Link>
          </p>
        ) : (
          <p className="mt-6 text-sm text-slate-400 text-center">
            <Link to="/get-started" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">Back to Get Started</Link>
          </p>
        )}
      </form>
    </div>
  );
}
