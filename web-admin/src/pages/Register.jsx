import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { registerEmployee, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleCredentialResponse = async (response) => {
    setError('');
    if (!response || !response.credential) {
      setError('Google did not return a valid authentication token');
      return;
    }
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      navigate('/employee/raise', { replace: true });
    } catch (err) {
      setError(err.message || 'Google registration failed');
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleSignIn = () => {
    if (!window.google) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '359317502287-mockid.apps.googleusercontent.com';
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredentialResponse,
    });

    const btnContainer = document.getElementById('google-register-btn');
    if (btnContainer) {
      window.google.accounts.id.renderButton(btnContainer, {
        theme: 'filled_blue',
        size: 'large',
        width: 384,
        text: 'signup_with',
        shape: 'pill',
      });
    }
  };

  useEffect(() => {
    const scriptId = 'google-gis-script';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = scriptId;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    script.onload = () => {
      initializeGoogleSignIn();
    };

    const timer = setTimeout(() => {
      if (window.google) {
        initializeGoogleSignIn();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

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

    // Password validation for employee (minimum 8 characters)
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
      await registerEmployee({ 
        name: name.trim(), 
        id: id.trim().toLowerCase(), 
        username: username.trim().toLowerCase(),
        password 
      });
      setSuccessMessage('Registration successful! We sent a verification link to your email address. Please verify your account before logging in.');
      setName('');
      setId('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
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
        <p className="mb-6 text-sm text-slate-400">Please fill out your details to create an account.</p>

        {error && (
          <div className="mb-4 text-sm text-red-400 font-semibold bg-red-950/40 border border-red-900/40 rounded-xl p-3">
            ⚠️ {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 text-sm text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-900/40 rounded-xl p-3">
            ✓ {successMessage}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-350 uppercase tracking-wider pl-1">Full Name</label>
            <input
              data-testid="registerName"
              type="text"
              className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 placeholder:text-slate-500 transition duration-200 text-sm"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-355 uppercase tracking-wider pl-1">Email Address</label>
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
            <label className="mb-1.5 block text-xs font-semibold text-slate-355 uppercase tracking-wider pl-1">Choose Username</label>
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
            <label className="mb-1.5 block text-xs font-semibold text-slate-355 uppercase tracking-wider pl-1">Password</label>
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

        <div className="my-4 flex items-center justify-between">
          <span className="w-1/5 border-b border-slate-700"></span>
          <span className="text-xs uppercase text-slate-400 font-semibold">Or continue with</span>
          <span className="w-1/5 border-b border-slate-700"></span>
        </div>
        <div className="flex justify-center">
          <div id="google-register-btn" className="w-full"></div>
        </div>

        <p className="mt-6 text-sm text-slate-400 text-center">
          Back to <Link data-testid="backToLoginLink" to="/" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">Login</Link>
        </p>
      </form>
    </div>
  );
}
