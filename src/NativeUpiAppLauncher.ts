import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface UpiApp {
  packageName: string;
  appName: string;
  icon?: string; // Base64 data URI format: "data:image/png;base64,<base64_string>"
  supportsSubscription: boolean; // Whether the app supports subscription/autopay (upi://mandate)
}

export interface LaunchUpiAppNativeResult {
  resultCode: number; // 0 = Success, 1 = Canceled, 2 = Failed
  error?: string;
  data?: string;
}

export interface Spec extends TurboModule {
  getInstalledUpiApps(): Promise<UpiApp[]>;
  launchUpiApp(packageName: string, url: string): Promise<LaunchUpiAppNativeResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('UpiAppLauncher');
