import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../utils/apiService';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  // Retrieve state passed from Login page
  const state = location.state || {};
  const [role, setRole] = useState(state.role || 'employee');
  const [userId, setUserId] = useState(state.userId || '');
  const [email, setEmail] = useState(state.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password rules validation
  const rules = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^a-zA-Z0-9]/.test(newPassword),
  };

  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.toLowerCase().endsWith('@xyzcompany.com')) {
      setError('Email must be a valid @xyzcompany.com address.');
      return;
    }

    if (!isPasswordValid) {
      setError('Please satisfy all password complexity requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.resetFirstPassword(role, userId, email, newPassword);
      setSuccess('Password updated successfully! Redirecting...');
      
      // Auto login
      setTimeout(() => {
        loginWithToken(res.token, res.session);
        const destination = role === 'employee' ? '/employee/raise' : '/manager/pending';
        navigate(destination, { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 sm:px-6 py-12 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-violet-200 bg-clip-text text-transparent">
          First-Time Password Reset
        </h1>
        <p className="mb-6 text-sm text-slate-400">
          For security reasons, you must reset your password before proceeding to your dashboard.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-green-500/20 bg-green-950/30 p-4 text-sm text-green-400">
            ✓ {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-350 uppercase tracking-wider pl-1">
              Select Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading || !!state.role}
              className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200 text-sm"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-350 uppercase tracking-wider pl-1">
              User ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. emp01"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={loading || !!state.userId}
              className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-350 uppercase tracking-wider pl-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="name@xyzcompany.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || !!state.email}
              className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-350 uppercase tracking-wider pl-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Choose a strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-4 pr-12 py-3 placeholder:text-slate-500 transition duration-200 text-sm"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition duration-200 text-xs font-semibold"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-350 uppercase tracking-wider pl-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200 text-sm"
            />
          </div>

          {/* Password Complexity checklist */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2 mt-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Complexity Requirements:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center gap-1.5 ${rules.length ? 'text-green-400' : 'text-slate-500'}`}>
                <span>{rules.length ? '✓' : '○'}</span>
                <span>Min 8 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${rules.uppercase ? 'text-green-400' : 'text-slate-500'}`}>
                <span>{rules.uppercase ? '✓' : '○'}</span>
                <span>Uppercase Letter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${rules.lowercase ? 'text-green-400' : 'text-slate-500'}`}>
                <span>{rules.lowercase ? '✓' : '○'}</span>
                <span>Lowercase Letter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${rules.number ? 'text-green-400' : 'text-slate-500'}`}>
                <span>{rules.number ? '✓' : '○'}</span>
                <span>Numeric Digit</span>
              </div>
              <div className={`flex items-center gap-1.5 ${rules.special ? 'text-green-400' : 'text-slate-500'}`}>
                <span>{rules.special ? '✓' : '○'}</span>
                <span>Special Character</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isPasswordValid}
          className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-500 hover:shadow-indigo-500/20 hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm"
        >
          {loading ? 'Updating Password...' : 'Reset & Login'}
        </button>

        <p className="mt-6 text-sm text-slate-500 text-center">
          Changed your mind? <Link to="/get-started" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">Back to Roles</Link>
        </p>
      </form>
    </div>
  );
}
