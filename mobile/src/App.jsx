import { useState, useEffect } from 'react';
import { IonApp, IonSpinner, setupIonicReact } from '@ionic/react';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

import api from './services/api';
import LoginScreen from './pages/LoginScreen';
import SuperadminLogin from './pages/SuperadminLogin';
import SuperadminView from './pages/SuperadminView';
import ManagerView from './pages/ManagerView';
import EmployeeView from './pages/EmployeeView';

setupIonicReact();

const emptyDb = {
  users: [],
  timeEntries: [],
  companies: [],
  stakeholders: [],
  projects: [],
  subProjects: [],
  activityTypes: [],
  teamMembers: [],
};

function AuthenticatedApp({ currentUser, setCurrentUser }) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeRole, setActiveRole] = useState(null);
  const [fullDb, setFullDb] = useState({ ...emptyDb });

  const roles = currentUser.roles || [];
  const isSuperadmin = roles.includes('Superadmin');
  const isManager = roles.includes('Manager');
  const isEmployee = roles.includes('Employee');
  const hasBothRoles = isManager && isEmployee;

  useEffect(() => {
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
    if (activeRole) {
      setIsLoading(true);
      api.getAllData()
        .then((data) => setFullDb(data))
        .catch((error) => {
          console.error('Failed to load data:', error);
          alert("Could not connect to the server. Please ensure it's running and try again.");
          handleLogout();
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
    setFullDb((prev) => ({ ...prev, users: newUsers }));
  };

  const handleToggleRole = (role) => {
    setActiveRole(role);
    localStorage.setItem('activeRole', role);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 16 }}>
        <IonSpinner name="crescent" />
        <p style={{ color: 'var(--ion-color-medium)' }}>Loading Timesheet Data...</p>
      </div>
    );
  }

  if (activeRole === 'Superadmin') {
    return <SuperadminView user={currentUser} onLogout={handleLogout} allUsers={fullDb.users} setUsers={handleSetUsers} />;
  }

  if (activeRole === 'Manager') {
    return (
      <ManagerView
        user={currentUser}
        fullDb={fullDb}
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
      fullDb={fullDb}
      setFullDb={setFullDb}
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
    return payload.exp * 1000 < Date.now() - 30000;
  } catch {
    return true;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitLoading, setIsInitLoading] = useState(true);
  const [showSuperadminLogin, setShowSuperadminLogin] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('authToken');
    if (savedUser && savedToken && !isTokenExpired(savedToken)) {
      setCurrentUser(JSON.parse(savedUser));
    } else if (savedToken) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('activeRole');
    }
    setIsInitLoading(false);
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  if (isInitLoading) {
    return (
      <IonApp>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <IonSpinner name="crescent" />
        </div>
      </IonApp>
    );
  }

  if (!currentUser) {
    return (
      <IonApp>
        {showSuperadminLogin ? (
          <SuperadminLogin onLogin={handleLogin} onBack={() => setShowSuperadminLogin(false)} />
        ) : (
          <LoginScreen onLogin={handleLogin} onSuperadminLogin={() => setShowSuperadminLogin(true)} />
        )}
      </IonApp>
    );
  }

  return (
    <IonApp>
      <AuthenticatedApp currentUser={currentUser} setCurrentUser={setCurrentUser} />
    </IonApp>
  );
}
