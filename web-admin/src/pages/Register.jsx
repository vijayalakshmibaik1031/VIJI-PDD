import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../utils/apiService';

export default function Register() {
  const { registerEmployee, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // States for polling/pending verification page
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Poll server for email verification status
  useEffect(() => {
    if (!isPendingVerification || !registeredEmail) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiService.checkVerificationStatus(registeredEmail);
        if (res.verified && res.token) {
          clearInterval(interval);
          loginWithToken(res.token, res.session);
          navigate('/employee/raise', { replace: true });
        }
      } catch (err) {
        console.error("Verification check failed:", err.message);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPendingVerification, registeredEmail, navigate, loginWithToken]);
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

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

    setLoading(true);
    try {
      // Auto-extract name from email address
      const emailLocalPart = id.split('@')[0];
      const autoName = emailLocalPart.replace(/[^a-zA-Z0-9]/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      await registerEmployee({ 
        name: autoName, 
        id: id.trim().toLowerCase(), 
        username: username.trim().toLowerCase(),
        password 
      });

      setRegisteredEmail(id.trim().toLowerCase());
      setIsPendingVerification(true);
      setSuccessMessage('Registration successful! Please check your email to verify your account.');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (isPendingVerification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 sm:px-6 py-12 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Verify Your Email</h2>
          <p className="text-sm text-slate-300">
            We sent a verification link to <span className="font-semibold text-indigo-300">{registeredEmail}</span>.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please check your inbox (and spam folder) and click the verification button. 
            This screen will automatically redirect you once verification is completed.
          </p>
          
          {error && (
            <div className="text-xs text-red-400 font-semibold bg-red-950/40 border border-red-900/40 rounded-xl p-2.5">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-900/40 rounded-xl p-2.5">
              {successMessage}
            </div>
          )}

          <div className="border-t border-slate-800 pt-4 flex flex-col gap-2">
            <button
              onClick={async () => {
                setError('');
                setSuccessMessage('');
                try {
                  const emailLocalPart = registeredEmail.split('@')[0];
                  const autoName = emailLocalPart.replace(/[^a-zA-Z0-9]/g, ' ')
                    .split(' ')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ');
                  await registerEmployee({ 
                    name: autoName, 
                    id: registeredEmail, 
                    username: username.trim().toLowerCase(), 
                    password 
                  });
                  setSuccessMessage('Verification email resent!');
                } catch (err) {
                  setError(err.message || 'Resend failed');
                }
              }}
              className="text-xs text-indigo-400 hover:text-indigo-350 font-semibold transition"
            >
              Resend Verification Email
            </button>
            <button
              onClick={() => {
                setIsPendingVerification(false);
                setRegisteredEmail('');
                setSuccessMessage('');
                setError('');
              }}
              className="text-xs text-slate-400 hover:text-slate-300 font-semibold transition"
            >
              Back to Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 sm:px-6 py-12">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl text-white">
        <h1 data-testid="registerTitle" className="mb-1 text-3xl font-extrabold text-white tracking-tight">Employee Registration</h1>
        <p className="mb-6 text-sm text-slate-400">Please fill out your details to create an account.</p>

        {error && (
          <div className="mb-4 text-sm text-red-400 font-semibold bg-red-950/40 border border-red-900/40 rounded-xl p-3">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-350 uppercase tracking-wider pl-1">Email Address</label>
            <input
              type="email"
              className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200 text-sm"
              placeholder="e.g. john@company.com"
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-350 uppercase tracking-wider pl-1">Choose Username</label>
            <input
              type="text"
              className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200 text-sm"
              placeholder="e.g. john_doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-350 uppercase tracking-wider pl-1">Password</label>
            <div className="relative">
              <input
                data-testid="registerPassword"
                type={showPassword ? 'text' : 'password'}
                className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-4 pr-12 py-3 placeholder:text-slate-500 transition duration-200 text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition duration-200 text-xs font-semibold"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-355 uppercase tracking-wider pl-1">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200 text-sm"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        <button
          data-testid="registerSubmit"
          type="submit"
          className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-500 hover:shadow-indigo-500/20 hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm"
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
