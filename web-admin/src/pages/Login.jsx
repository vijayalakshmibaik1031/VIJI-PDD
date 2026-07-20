import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const params = useParams();

  const initialRole = params.role || 'employee';
  const [role] = useState(initialRole);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleCredentialResponse = async (response) => {
    setError('');
    try {
      await loginWithGoogle(response.credential);
      navigate('/employee/raise', { replace: true });
    } catch (err) {
      setError(err.message || 'Google login failed');
    }
  };

  const initializeGoogleSignIn = () => {
    if (!window.google) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '359317502287-mockid.apps.googleusercontent.com';
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredentialResponse,
    });

    const btnContainer = document.getElementById('google-signin-btn');
    if (btnContainer) {
      window.google.accounts.id.renderButton(btnContainer, {
        theme: 'filled_blue',
        size: 'large',
        width: 384,
        text: 'signin_with',
        shape: 'pill',
      });
    }
  };

  useEffect(() => {
    setError('');

    if (role === 'employee') {
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
    }
  }, [role]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const session = await login({ role, userId: userId.trim(), password });
      let destination = '/';
      if (session.role === 'employee') destination = '/employee/raise';
      else if (session.role === 'manager') destination = '/manager/pending';
      else if (session.role === 'authority') destination = '/authority/overview';
      navigate(destination, { replace: true });
    } catch (err) {
      if (role === 'employee') {
        setError('user not found');
      } else {
        setError(err.message || 'Login failed');
      }
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
            <div className="relative">
              <input
                data-testid="password"
                type={showPassword ? 'text' : 'password'}
                className="w-full bg-slate-800/85 border border-slate-700/80 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-4 pr-12 py-3 placeholder:text-slate-500 transition duration-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition duration-200"
                onClick={() => setShowPassword(!showPassword)}
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

        {error ? <p data-testid="loginError" className="mt-4 text-sm text-red-400 font-semibold">{error}</p> : null}

        <button
          data-testid="loginButton"
          type="submit"
          className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-500 hover:shadow-indigo-500/20 hover:shadow-lg transition-all duration-200"
        >
          Login
        </button>

        {role === 'employee' && (
          <>
            <div className="my-4 flex items-center justify-between">
              <span className="w-1/5 border-b border-slate-700"></span>
              <span className="text-xs uppercase text-slate-400 font-semibold">Or continue with</span>
              <span className="w-1/5 border-b border-slate-700"></span>
            </div>
            <div className="flex justify-center">
              <div id="google-signin-btn" className="w-full"></div>
            </div>
          </>
        )}

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
