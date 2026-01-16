/**
 * @format
 */

import * as Sentry from '@sentry/react-native';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Initialize Sentry for error monitoring
// Only initialize if DSN is provided (production/staging)
const SENTRY_DSN = ''; // Set this in production build or via environment

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: __DEV__ ? 'development' : 'production',
        tracesSampleRate: 0.0, // Disable performance monitoring
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000,
    });
}

// Wrap App with Sentry for error boundary
const SentryApp = SENTRY_DSN ? Sentry.wrap(App) : App;

AppRegistry.registerComponent(appName, () => SentryApp);
