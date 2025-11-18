const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin to add Android queries declaration for UPI apps
 * This allows the app to query for installed UPI apps on Android 11+
 */
const withUpiAppLauncher = (config) => {
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    // Ensure manifest exists
    if (!androidManifest.manifest) {
      androidManifest.manifest = {};
    }

    // Initialize queries array if it doesn't exist
    if (!androidManifest.manifest.queries) {
      androidManifest.manifest.queries = [];
    }

    // Check if UPI query already exists
    const hasUpiQuery = androidManifest.manifest.queries.some(
      (query) =>
        query.intent &&
        query.intent.some(
          (intent) =>
            intent.action &&
            intent.action.some(
              (action) => action.$['android:name'] === 'android.intent.action.VIEW'
            ) &&
            intent.data &&
            intent.data.some(
              (data) =>
                data.$['android:scheme'] === 'upi' &&
                data.$['android:host'] === 'pay'
            )
        )
    );

    // Add UPI query if it doesn't exist
    if (!hasUpiQuery) {
      androidManifest.manifest.queries.push({
        intent: [
          {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
            data: [
              {
                $: {
                  'android:scheme': 'upi',
                  'android:host': 'pay',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });

  return config;
};

module.exports = withUpiAppLauncher;

