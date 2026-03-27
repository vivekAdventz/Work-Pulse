import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adventz.timesheet',
  appName: 'Adventz Timesheet',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
};

export default config;
