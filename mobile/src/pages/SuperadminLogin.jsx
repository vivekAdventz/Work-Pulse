import { useState } from 'react';
import {
  IonPage, IonContent, IonInput, IonButton, IonText, IonSpinner,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
} from '@ionic/react';
import api from '../services/api';

export default function SuperadminLogin({ onLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
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
    <IonPage>
      <IonContent className="ion-padding" style={{ '--background': 'var(--ion-color-dark)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
          <IonCard style={{ width: '100%', maxWidth: 400 }}>
            <IonCardHeader className="ion-text-center">
              <IonCardTitle style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                Superadmin Login
              </IonCardTitle>
              <IonText color="medium">
                <p>Adventz Timesheet Administration</p>
              </IonText>
            </IonCardHeader>
            <IonCardContent>
              <IonInput
                type="email"
                label="Email Address"
                labelPlacement="floating"
                fill="outline"
                placeholder="superadmin@adventz.com"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value || '')}
                className="ion-margin-bottom"
                disabled={isLoading}
              />
              <IonInput
                type="password"
                label="Password"
                labelPlacement="floating"
                fill="outline"
                placeholder="Enter password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value || '')}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="ion-margin-bottom"
                disabled={isLoading}
              />
              {error && (
                <IonText color="danger" className="ion-text-center">
                  <p style={{ fontSize: '0.85rem' }}>{error}</p>
                </IonText>
              )}
              <IonButton expand="block" color="dark" onClick={handleSubmit} disabled={isLoading} className="ion-margin-top">
                {isLoading ? <IonSpinner name="crescent" /> : 'Login'}
              </IonButton>
              <div className="ion-text-center" style={{ marginTop: 16 }}>
                <IonText color="medium" style={{ fontSize: '0.85rem' }}>
                  <span
                    onClick={onBack}
                    style={{ textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Back to Employee Login
                  </span>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
}
