import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeAccount() {
  const { session, updateEmployeeProfile } = useAuth();
  const [name, setName] = useState(session?.name || '');
  const [username, setUsername] = useState(session?.username || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const payload = {};

    if (name.trim() !== session.name) {
      payload.name = name.trim();
    }

    if (username.trim() !== session.username) {
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters long');
        return;
      }
      payload.username = username.trim();
    }

    if (password) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Password validation constraints (minimum 8 characters)
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setError('Password must contain at least one uppercase letter');
        return;
      }
      if (!/[a-z]/.test(password)) {
        setError('Password must contain at least one lowercase letter');
        return;
      }
      if (!/[0-9]/.test(password)) {
        setError('Password must contain at least one numeric digit');
        return;
      }
      if (!/[^a-zA-Z0-9]/.test(password)) {
        setError('Password must contain at least one special character/symbol');
        return;
      }
      payload.password = password;
    }

    if (Object.keys(payload).length === 0) {
      setMessage('No changes to save.');
      return;
    }

    setLoading(true);
    try {
      await updateEmployeeProfile(payload);
      setMessage('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-6 sm:p-8 text-white shadow-xl">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Edit Profile Credentials</h2>
        <p className="text-sm text-slate-400 mb-6">
          Update your profile settings, choose a custom username, or change your manual sign-in password.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-400 font-semibold bg-red-950/40 border border-red-900/40 rounded-xl p-3">
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div className="mb-4 text-sm text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-900/40 rounded-xl p-3">
            ✓ {message}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">
                Google Email / Employee ID
              </label>
              <input
                type="text"
                className="w-full bg-slate-950/50 border border-slate-800 text-slate-500 rounded-xl px-4 py-3 text-sm cursor-not-allowed"
                value={session?.userId || ''}
                disabled
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">
                Display Name
              </label>
              <input
                type="text"
                className="w-full bg-slate-800/60 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200 text-sm"
                placeholder="Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">
              Custom Username (Optional Login Handle)
            </label>
            <input
              type="text"
              className="w-full bg-slate-800/60 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200 text-sm"
              placeholder="e.g. alex_123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <p className="mt-1.5 text-xs text-slate-400 pl-1">
              You can log in manually using either your email ID or this username.
            </p>
          </div>

          <div className="border-t border-slate-800 pt-5 mt-6">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-slate-800/60 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-4 pr-12 py-3 placeholder:text-slate-500 transition duration-200 text-sm"
                    placeholder="Leave blank to keep same"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
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
                <label className="mb-1.5 block text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-slate-800/60 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200 text-sm"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full sm:w-auto px-8 rounded-xl bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-500 hover:shadow-indigo-500/20 hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {loading ? 'Saving Changes...' : 'Save Profile Details'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900/10 p-6 text-xs text-slate-400">
        <p className="font-semibold text-slate-300 mb-1">Access Notes:</p>
        <p>Your private complaints are visible only to you, your manager, and system administrators.</p>
      </div>
    </div>
  );
}
