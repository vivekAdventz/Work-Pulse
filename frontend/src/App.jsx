import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import api from './api';
import LoginScreen from './components/auth/LoginScreen';
import SuperadminLogin from './components/auth/SuperadminLogin';
import SuperadminView from './views/SuperadminView';
import ManagerView from './views/ManagerView';
import EmployeeView from './views/EmployeeView';
import { isCapacitorApp } from './msalConfig';

function AuthenticatedApp({ currentUser, setCurrentUser }) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeRole, setActiveRole] = useState(null);
  const [fullDbState, setFullDbState] = useState({
    users: [],
    timeEntries: [],
    companies: [],
    stakeholders: [],
    projects: [],
    subProjects: [],
    activityTypes: [],
    teamMembers: [],
  });

  // Determine which roles the user has
  const roles = currentUser.roles || [];
  const isSuperadmin = roles.includes('Superadmin');
  const isManager = roles.includes('Manager');
  const isEmployee = roles.includes('Employee');
  const hasBothRoles = isManager && isEmployee;

  useEffect(() => {
    // Set initial active role
    if (isSuperadmin) {
      setActiveRole('Superadmin');
    } else if (hasBothRoles) {
      const savedRole = localStorage.getItem('activeRole');
      setActiveRole(savedRole && roles.includes(savedRole) ? savedRole : 'Employee');
    } else if (isManager) {
      setActiveRole('Manager');
    } else {
      setActiveRole('Employee');
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeRole && activeRole !== 'Superadmin') {
      setIsLoading(true);
      api.getAllData()
        .then((data) => setFullDbState(data))
        .catch((error) => {
          console.error('Failed to load data from server:', error);
          alert("Could not connect to the server. Please ensure it's running and try again.");
          handleLogout();
        })
        .finally(() => setIsLoading(false));
    } else if (activeRole === 'Superadmin') {
      setIsLoading(true);
      api.getAllData()
        .then((data) => setFullDbState(data))
        .catch((error) => {
          console.error('Failed to load data from server:', error);
        })
        .finally(() => setIsLoading(false));
    }
  }, [currentUser, activeRole]);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('activeRole');
  };

  const handleSetUsers = (newUsers) => {
    setFullDbState((prev) => ({ ...prev, users: newUsers }));
  };

  const handleToggleRole = (role) => {
    setActiveRole(role);
    localStorage.setItem('activeRole', role);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading Timesheet Data...</div>;
  }

  if (activeRole === 'Superadmin') {
    return <SuperadminView user={currentUser} onLogout={handleLogout} allUsers={fullDbState.users} setUsers={handleSetUsers} />;
  }

  if (activeRole === 'Manager') {
    return (
      <ManagerView
        user={currentUser}
        fullDb={fullDbState}
        onLogout={handleLogout}
        hasBothRoles={hasBothRoles}
        activeRole={activeRole}
        onToggleRole={handleToggleRole}
      />
    );
  }

  return (
    <EmployeeView
      user={currentUser}
      fullDb={fullDbState}
      setFullDb={setFullDbState}
      onLogout={handleLogout}
      hasBothRoles={hasBothRoles}
      activeRole={activeRole}
      onToggleRole={handleToggleRole}
    />
  );
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // expired if exp is in the past (with 30s buffer)
    return payload.exp * 1000 < Date.now() - 30000;
  } catch {
    return true;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitLoading, setIsInitLoading] = useState(true);
  const [ssoError, setSsoError] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { msalInstance } = await import('./msalConfig');
      await msalInstance.initialize();

      if (isCapacitorApp) {
        // === MOBILE: listen for the msauth:// deep link fired after in-app browser login ===
        CapacitorApp.addListener('appUrlOpen', async (event) => {
          if (event.url.startsWith('msauth://')) {
            try {
              // 1. Close the in-app browser so the user sees the app
              await Browser.close();

              // 2. MSAL's handleRedirectPromise() reads auth code from window.location
              //    (NOT from a passed URL). Extract params from the deep link and
              //    push them onto the current page so MSAL can find them.
              try {
                const deepLink = new URL(event.url);
                const params = deepLink.searchParams.toString();
                const hash = deepLink.hash;
                const newUrl =
                  window.location.origin +
                  window.location.pathname +
                  (params ? '?' + params : '') +
                  (hash || '');
                window.history.replaceState({}, document.title, newUrl);
              } catch (_) { /* malformed URL — carry on */ }

              // 3. Now MSAL can read the code from window.location
              const response = await msalInstance.handleRedirectPromise();
              if (response?.accessToken) {
                const result = await api.microsoftLogin(response.accessToken);
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                setCurrentUser(result.user);
              }
            } catch (e) {
              console.error('Mobile SSO callback failed:', e);
              setSsoError(e.message || 'SSO Login Failed. Please try again.');
              setTimeout(() => setSsoError(null), 8000);
            }
          }
        });
      } else {
        // === WEB: handle the standard redirect response on page load ===
        try {
          const response = await msalInstance.handleRedirectPromise();
          if (response?.accessToken) {
            const result = await api.microsoftLogin(response.accessToken);
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            setCurrentUser(result.user);
            setIsInitLoading(false);
            return;
          }
        } catch (e) {
          console.error('Microsoft redirect login failed:', e);
          setSsoError(e.message || 'SSO Login Failed: User not found or unauthorized.');
          setTimeout(() => setSsoError(null), 8000);
        }
      }

      // Normal session restore — validate token before restoring
      const savedUser = localStorage.getItem('currentUser');
      const savedToken = localStorage.getItem('authToken');
      if (savedUser && savedToken && !isTokenExpired(savedToken)) {
        setCurrentUser(JSON.parse(savedUser));
      } else if (savedToken) {
        // Token exists but is expired/invalid — clean up
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('activeRole');
      }
      setIsInitLoading(false);
    };
    init();
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('activeRole');
  };

  if (isInitLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <>
      {ssoError && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] bg-rose-600 text-white px-6 py-3.5 rounded-xl shadow-2xl flex items-center justify-between gap-4 max-w-md w-full sm:w-auto animate-bounce duration-300">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="font-semibold">{ssoError}</span>
          </div>
          <button onClick={() => setSsoError(null)} className="text-rose-200 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>
      )}
      <BrowserRouter>
        <Routes>
        <Route
          path="/superadmin/login"
          element={
            currentUser && currentUser.roles?.includes('Superadmin')
              ? <Navigate to="/" replace />
              : <SuperadminLogin onLogin={handleLogin} />
          }
        />
        <Route
          path="/*"
          element={
            currentUser
              ? <AuthenticatedApp currentUser={currentUser} setCurrentUser={setCurrentUser} />
              : <LoginScreen onLogin={handleLogin} />
          }
        />
      </Routes>
    </BrowserRouter>
    </>
  );
}
