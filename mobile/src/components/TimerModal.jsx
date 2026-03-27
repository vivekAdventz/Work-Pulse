import { useState, useEffect } from 'react';
import { IonModal, IonButton, IonIcon, IonText } from '@ionic/react';
import { playOutline, pauseOutline, stopOutline } from 'ionicons/icons';

export default function TimerModal({ isOpen, onStop }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setElapsedSeconds(0);
      setIsPaused(false);
      return;
    }
    let interval = null;
    if (!isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isOpen, isPaused]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <IonModal isOpen={isOpen} backdropDismiss={false}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', padding: 32, background: 'var(--ion-background-color)',
      }}>
        <IonText color="primary">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 24 }}>Timer Running</h1>
        </IonText>
        <div style={{
          fontSize: '3.5rem', fontFamily: 'monospace', fontWeight: 700,
          background: 'var(--ion-color-light)', padding: '24px 32px', borderRadius: 16,
          marginBottom: 32, letterSpacing: 4,
        }}>
          {formatTime(elapsedSeconds)}
        </div>
        <div style={{ display: 'flex', gap: 16, width: '100%', justifyContent: 'center' }}>
          <IonButton
            size="large"
            color={isPaused ? 'primary' : 'warning'}
            onClick={() => setIsPaused(!isPaused)}
            style={{ flex: 1, maxWidth: 160 }}
          >
            <IonIcon slot="start" icon={isPaused ? playOutline : pauseOutline} />
            {isPaused ? 'Resume' : 'Pause'}
          </IonButton>
          <IonButton
            size="large"
            color="danger"
            onClick={onStop}
            style={{ flex: 1, maxWidth: 160 }}
          >
            <IonIcon slot="start" icon={stopOutline} />
            Stop
          </IonButton>
        </div>
      </div>
    </IonModal>
  );
}
