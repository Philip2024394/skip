import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skiptheapp.app',
  appName: 'SkipTheApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#000000',
    // Allow back button to navigate within the app
    handleApplicationNotifications: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
