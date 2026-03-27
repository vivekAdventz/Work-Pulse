import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';
import LoginScreen from './components/LoginScreen';
import SuperadminLogin from './components/SuperadminLogin';
import SuperadminView from './views/SuperadminView';
import ManagerView from './views/ManagerView';
import EmployeeView from './views/EmployeeView';

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

  useEffect(() => {
    const init = async () => {
      // Handle Microsoft redirect response if returning from MS login
      try {
        const { msalInstance } = await import('./msalConfig');
        await msalInstance.initialize();
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
  );
}
