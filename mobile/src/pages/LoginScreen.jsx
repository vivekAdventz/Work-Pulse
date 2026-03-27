import { useState } from 'react';
import {
  IonPage, IonContent, IonInput, IonButton, IonText, IonSpinner,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
} from '@ionic/react';
import api from '../services/api';

export default function LoginScreen({ onLogin, onSuperadminLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const result = await api.login(email);
      localStorage.setItem('authToken', result.token);
      onLogin(result.user);
    } catch (e) {
      setError(e.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" color="light">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
          <IonCard style={{ width: '100%', maxWidth: 400 }}>
            <IonCardHeader className="ion-text-center">
              <IonCardTitle color="primary" style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                Adventz Timesheet
              </IonCardTitle>
              <IonText color="medium">
                <p>Please sign in to continue</p>
              </IonText>
            </IonCardHeader>
            <IonCardContent>
              <IonInput
                type="email"
                label="Email"
                labelPlacement="floating"
                fill="outline"
                placeholder="Enter your email"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value || '')}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="ion-margin-bottom"
                disabled={isLoading}
              />
              {error && (
                <IonText color="danger" className="ion-text-center">
                  <p style={{ fontSize: '0.85rem' }}>{error}</p>
                </IonText>
              )}
              <IonButton expand="block" onClick={handleLogin} disabled={isLoading} className="ion-margin-top">
                {isLoading ? <IonSpinner name="crescent" /> : 'Sign In'}
              </IonButton>
              <div className="ion-text-center" style={{ marginTop: 16 }}>
                <IonText color="medium" style={{ fontSize: '0.85rem' }}>
                  <span
                    onClick={onSuperadminLogin}
                    style={{ textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Superadmin Login
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
