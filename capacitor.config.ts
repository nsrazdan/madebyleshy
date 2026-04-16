import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.madebyleshy.app',
  appName: 'Leshy',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
