# react-native-upi-app-launcher

React Native library to get installed UPI apps and launch them with intents on Android.

## Features

- 📱 Get list of installed UPI apps on Android devices
- 🚀 Launch UPI apps with custom URLs
- 💳 Check if apps support subscription/autopay (mandate)
- 🎨 Get app icons as base64 data URIs
- ✅ Works with both old and new React Native architecture

## Installation

```sh
npm install @lokal-dev/react-native-upi-app-launcher
```

or

```sh
yarn add @lokal-dev/react-native-upi-app-launcher
```

### Android Setup

#### Regular React Native

No additional setup required! The library's `AndroidManifest.xml` is automatically merged.

#### Expo

Add the plugin to your `app.json` or `app.config.js`:

```json
{
  "plugins": ["@lokal-dev/react-native-upi-app-launcher"]
}
```

Then run:

```sh
npx expo prebuild
```

## Usage

### Basic Example

```tsx
import UpiAppLauncher, { LaunchResult } from '@lokal-dev/react-native-upi-app-launcher';

// Check if available (Android only)
if (!UpiAppLauncher.isAvailable()) {
  console.log('UPI App Launcher is only available on Android');
  return;
}

// Get installed UPI apps
const apps = await UpiAppLauncher.getInstalledUpiApps();
console.log('Installed UPI apps:', apps);

// Launch a UPI app
const result = await UpiAppLauncher.launchUpiApp({
  packageName: 'com.phonepe.app', // Optional: omit to show chooser
  url: 'upi://pay?pa=merchant@upi&pn=Merchant&am=100.00&cu=INR&tn=Payment',
});

if (result.result === LaunchResult.Success) {
  console.log('Payment completed!');
}
```

### Get Subscription-Supported Apps

```tsx
// Get only apps that support subscription/autopay
const subscriptionApps = await UpiAppLauncher.getSubscriptionSupportedApps();
```

### Launch Without Package Name

```tsx
// Shows app chooser dialog
const result = await UpiAppLauncher.launchUpiApp({
  url: 'upi://pay?pa=merchant@upi&am=100.00',
});
```

## API Reference

### `isAvailable(): boolean`

Check if the module is available (Android only).

### `getInstalledUpiApps(): Promise<UpiApp[]>`

Get list of installed UPI apps.

**Returns:** Array of `UpiApp` objects with:
- `packageName: string` - App package name
- `appName: string` - Display name
- `icon?: string` - Base64 data URI (format: `data:image/png;base64,...`)
- `supportsSubscription: boolean` - Whether app supports `upi://mandate`

### `getSubscriptionSupportedApps(): Promise<UpiApp[]>`

Get only UPI apps that support subscription/autopay.

### `launchUpiApp(options: LaunchUpiAppOptions): Promise<LaunchUpiAppResult>`

Launch a UPI app with the given URL.

**Options:**
- `url: string` - UPI URL (required)
- `packageName?: string` - App package name (optional, shows chooser if omitted)

**Returns:** `LaunchUpiAppResult` with:
- `result: LaunchResult` - `Success`, `Canceled`, `Failed`, or `Error`
- `error?: string` - Error message if failed

## UPI URL Format

### Payment URL

Standard UPI payment URL format:

```
upi://pay?pa=<payee_address>&pn=<payee_name>&am=<amount>&cu=<currency>&tn=<transaction_note>
```

Example:

```
upi://pay?pa=merchant@upi&pn=Test%20Merchant&am=100.00&cu=INR&tn=Test%20Payment
```

### Subscription/Autopay (Mandate) URL

For recurring payments and subscriptions:

```
upi://mandate?pa=<payee_address>&pn=<payee_name>&am=<amount>&cu=<currency>&tn=<transaction_note>&mc=<merchant_code>&mam=<max_amount>&mtu=<max_amount_unit>&tr=<transaction_ref>&validity=<validity_days>
```

Example:

```tsx
// Launch subscription setup
const result = await UpiAppLauncher.launchUpiApp({
  packageName: 'com.phonepe.app', // Use an app that supports subscriptions
  url: 'upi://mandate?pa=merchant@upi&pn=Subscription&am=100.00&cu=INR&tn=Monthly%20Subscription&mam=500.00&validity=365',
});

// Check if app supports subscriptions before launching
const subscriptionApps = await UpiAppLauncher.getSubscriptionSupportedApps();
if (subscriptionApps.length > 0) {
  await UpiAppLauncher.launchUpiApp({
    packageName: subscriptionApps[0].packageName,
    url: 'upi://mandate?pa=merchant@upi&am=100.00&tn=Subscription',
  });
}
```

**Mandate Parameters:**
- `pa` - Payee address (VPA)
- `pn` - Payee name
- `am` - Amount
- `cu` - Currency (INR)
- `tn` - Transaction note
- `mc` - Merchant code (optional)
- `mam` - Maximum amount per transaction (optional)
- `mtu` - Maximum amount unit (optional)
- `tr` - Transaction reference (optional)
- `validity` - Validity in days (optional)

## Requirements

- React Native >= 0.60
- Android API level 21+ (Android 5.0+)
- Android 11+ (API 30+) requires `<queries>` declaration in manifest (handled automatically)

## License

MIT
