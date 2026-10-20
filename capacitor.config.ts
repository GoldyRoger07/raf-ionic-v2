import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.raikiservice.raf',
  appName: 'RAF',
  webDir: 'www',
  backgroundColor: '#0b2a6f',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0b2a6f',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'ionic',
    },
  },
};

export default config;
