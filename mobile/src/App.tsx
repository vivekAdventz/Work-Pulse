import { useState, useEffect } from 'react';
import { IonApp, IonSpinner, setupIonicReact } from '@ionic/react';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

import { User, FullDbState } from './types';
import api from './services/api';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import ConfigPage from './pages/Config';

setupIonicReact();

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitLoading, setIsInitLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [fullDb, setFullDb] = useState<FullDbState>({
    users: [],
    timeEntries: [],
    companies: [],
    stakeholders: [],
    projects: [],
    subProjects: [],
    activityTypes: [],
    teamMembers: [],
  });

  // Restore saved session
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('authToken');
    if (savedUser && savedToken) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
    }
    setIsInitLoading(false);
  }, []);

  // Load data when user is authenticated
  useEffect(() => {
    if (currentUser) {
      setIsDataLoading(true);
      api.getAllData()
        .then(data => setFullDb(data))
        .catch(error => {
          console.error('Failed to load data:', error);
          handleLogout();
        })
        .finally(() => setIsDataLoading(false));
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    setActiveView('dashboard');
    setFullDb({
      users: [], timeEntries: [], companies: [], stakeholders: [],
      projects: [], subProjects: [], activityTypes: [], teamMembers: [],
    });
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
        <LoginPage onLogin={handleLogin} />
      </IonApp>
    );
  }

  if (isDataLoading) {
    return (
      <IonApp>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 16 }}>
          <IonSpinner name="crescent" />
          <p style={{ color: 'var(--ion-color-medium)' }}>Loading Timesheet Data...</p>
        </div>
      </IonApp>
    );
  }

  return (
    <IonApp>
      {activeView === 'dashboard' ? (
        <Dashboard
          user={currentUser}
          fullDb={fullDb}
          setFullDb={setFullDb}
          onLogout={handleLogout}
          onNavigate={setActiveView}
        />
      ) : (
        <ConfigPage
          user={currentUser}
          fullDb={fullDb}
          setFullDb={setFullDb}
          onBack={() => setActiveView('dashboard')}
        />
      )}
    </IonApp>
  );
};

export default App;
