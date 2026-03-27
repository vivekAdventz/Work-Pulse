import { useState } from 'react';
import api from '../api';

export default function SuperadminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await api.superadminLogin(email, password);
      localStorage.setItem('authToken', result.token);
      onLogin(result.user);
    } catch (e) {
      setError(e.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">Superadmin Login</h1>
          <p className="mt-2 text-slate-500">WorkPulse Administration</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="sa-email" className="text-sm font-medium text-slate-700">Email Address</label>
            <input
              id="sa-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 mt-1 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
              placeholder="superadmin@adventz.com"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="sa-password" className="text-sm font-medium text-slate-700">Password</label>
            <input
              id="sa-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 mt-1 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
              placeholder="Enter password"
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-center text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 font-semibold text-white bg-slate-800 rounded-lg shadow-md hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
