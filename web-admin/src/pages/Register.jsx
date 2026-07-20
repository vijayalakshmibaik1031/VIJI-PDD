import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { registerEmployee, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleCredentialResponse = async (response) => {
    setError('');
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

    // Password validation for employee
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
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
            <div className="relative">
              <input
                data-testid="registerPassword"
                type={showPassword ? 'text' : 'password'}
                className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-4 pr-12 py-3 placeholder:text-slate-500 transition duration-200"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition duration-200"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
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
