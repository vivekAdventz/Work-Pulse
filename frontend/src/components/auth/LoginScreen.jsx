import { useState } from 'react';
import api from '../../api';
import { msalInstance, loginRequest } from '../../msalConfig';

function TimesheetIllustration() {
  return (
    <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md">
      {/* Background circle */}
      <circle cx="250" cy="250" r="220" fill="#f0f9ff" />
      <circle cx="250" cy="250" r="180" fill="#e0f2fe" opacity="0.6" />

      {/* Calendar/timesheet shape */}
      <rect x="130" y="120" width="240" height="280" rx="16" fill="white" stroke="#0ea5e9" strokeWidth="2" />
      <rect x="130" y="120" width="240" height="56" rx="16" fill="#0ea5e9" />
      <rect x="130" y="160" width="240" height="16" fill="#0ea5e9" />

      {/* Calendar dots on header */}
      <circle cx="170" cy="148" r="8" fill="white" opacity="0.9" />
      <circle cx="250" cy="148" r="8" fill="white" opacity="0.9" />
      <circle cx="330" cy="148" r="8" fill="white" opacity="0.9" />

      {/* Grid lines */}
      <line x1="150" y1="210" x2="350" y2="210" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="150" y1="245" x2="350" y2="245" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="150" y1="280" x2="350" y2="280" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="150" y1="315" x2="350" y2="315" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="150" y1="350" x2="350" y2="350" stroke="#e2e8f0" strokeWidth="1" />

      {/* Time entry bars */}
      <rect x="160" y="195" width="80" height="10" rx="5" fill="#0ea5e9" opacity="0.8" />
      <rect x="260" y="195" width="50" height="10" rx="5" fill="#38bdf8" opacity="0.6" />

      <rect x="160" y="230" width="120" height="10" rx="5" fill="#0ea5e9" opacity="0.7" />

      <rect x="160" y="265" width="60" height="10" rx="5" fill="#38bdf8" opacity="0.8" />
      <rect x="240" y="265" width="90" height="10" rx="5" fill="#0ea5e9" opacity="0.5" />

      <rect x="160" y="300" width="100" height="10" rx="5" fill="#0ea5e9" opacity="0.9" />

      <rect x="160" y="335" width="70" height="10" rx="5" fill="#38bdf8" opacity="0.7" />
      <rect x="250" y="335" width="80" height="10" rx="5" fill="#0ea5e9" opacity="0.6" />

      {/* Clock icon */}
      <circle cx="390" cy="140" r="40" fill="white" stroke="#0ea5e9" strokeWidth="2.5" />
      <circle cx="390" cy="140" r="34" fill="#f0f9ff" />
      <line x1="390" y1="140" x2="390" y2="118" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="390" y1="140" x2="406" y2="148" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="390" cy="140" r="3" fill="#0ea5e9" />

      {/* Person silhouette */}
      <circle cx="110" cy="340" r="22" fill="#0ea5e9" opacity="0.2" />
      <circle cx="110" cy="332" r="10" fill="#0ea5e9" opacity="0.6" />
      <path d="M90 365 Q110 348 130 365" fill="#0ea5e9" opacity="0.4" />

      {/* Checkmark badge */}
      <circle cx="380" cy="320" r="24" fill="#10b981" opacity="0.15" />
      <circle cx="380" cy="320" r="16" fill="#10b981" opacity="0.3" />
      <path d="M372 320 L378 326 L390 314" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Floating dots decoration */}
      <circle cx="160" cy="430" r="4" fill="#0ea5e9" opacity="0.3" />
      <circle cx="340" cy="90" r="3" fill="#38bdf8" opacity="0.4" />
      <circle cx="400" cy="400" r="5" fill="#0ea5e9" opacity="0.2" />
      <circle cx="100" cy="180" r="3" fill="#38bdf8" opacity="0.3" />
    </svg>
  );
}

export default function LoginScreen({ onLogin }) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('manual');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleMicrosoftLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await msalInstance.initialize();
      await msalInstance.loginRedirect(loginRequest);
    } catch (e) {
      setError(e.message || 'An error occurred during login.');
      setIsLoading(false);
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await api.manualLogin(email, password);
      localStorage.setItem('authToken', result.token);
      onLogin(result.user);
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100 relative">
      {/* Logos on Top */}
      <div className="absolute top-0 w-full flex justify-between items-center p-6 z-50 pointer-events-none">
        <img src="https://www.zuariindustries.in/assets/web/img/logo/zuari_logo.png" alt="Zuari Logo" className="h-10 md:h-12 drop-shadow-md bg-white/80 p-1 rounded backdrop-blur-sm" />
        <img src="https://www.zuariindustries.in/assets/web/img/logo/adventz.png" alt="Adventz Logo" className="h-10 md:h-12 drop-shadow-md bg-white/80 p-1 rounded backdrop-blur-sm" />
      </div>
      {/* Left side — illustration */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 bg-gradient-to-br from-sky-600 to-sky-800 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white/5 rounded-full" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          <TimesheetIllustration />
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-white">Track Your Time Effortlessly</h2>
            <p className="text-sky-100 text-lg max-w-md leading-relaxed">
              Log hours, manage projects, and gain insights into your team's productivity — all in one place.
            </p>
          </div>
          <div className="flex items-center gap-8 text-sky-100 text-sm mt-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              <span>Real-time Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              <span>Team Reports</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              <span>AI Summaries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & heading */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-sky-600 rounded-xl shadow-lg shadow-sky-200 mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Welcome back</h1>
            <p className="mt-2 text-slate-500">Sign in to Workpulse</p>
          </div>

          {/* Tab toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => { setLoginMode('manual'); setError(''); }}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${loginMode === 'manual' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Email &amp; Password
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('microsoft'); setError(''); }}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${loginMode === 'microsoft' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Microsoft SSO
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          {loginMode === 'manual' ? (
            <form onSubmit={handleManualLogin} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  placeholder="name@company.com"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 font-semibold text-white bg-sky-600 rounded-xl shadow-md shadow-sky-200 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all disabled:bg-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 text-center">Sign in using your organization's Microsoft account</p>
              <button
                onClick={handleMicrosoftLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                {isLoading ? 'Signing in...' : 'Continue with Microsoft'}
              </button>
            </div>
          )}

          <p className="text-center text-xs text-slate-500 pt-4">
            &copy; {new Date().getFullYear()} Workpulse. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
