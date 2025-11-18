import { Platform } from 'react-native';
import NativeUpiAppLauncher, {
  type UpiApp,
  type LaunchUpiAppNativeResult,
} from './NativeUpiAppLauncher';

export type { UpiApp };

export enum LaunchResult {
  Success = 'success',
  Canceled = 'canceled',
  Failed = 'failed',
  Error = 'error',
}

export interface LaunchUpiAppOptions {
  url: string;
  packageName?: string; // Optional: If provided, launches specific app. If omitted, shows chooser
}

export interface LaunchUpiAppResult {
  result: LaunchResult;
  error?: string;
}

class UpiAppLauncherModule {
  /**
   * Check if the module is available
   */
  isAvailable(): boolean {
    return Platform.OS === 'android' && NativeUpiAppLauncher != null;
  }

  /**
   * Get list of installed UPI apps on the device
   * @returns Promise resolving to array of UPI apps
   */
  async getInstalledUpiApps(): Promise<UpiApp[]> {
    if (!this.isAvailable()) {
      throw new Error('UpiAppLauncher is only available on Android');
    }
    return NativeUpiAppLauncher.getInstalledUpiApps();
  }

  /**
   * Get list of UPI apps that support subscription/autopay
   * @returns Promise resolving to array of UPI apps that support subscriptions
   */
  async getSubscriptionSupportedApps(): Promise<UpiApp[]> {
    const apps = await this.getInstalledUpiApps();
    return apps.filter((app) => app.supportsSubscription);
  }

  /**
   * Launch a UPI app with the given URL
   * @param options - Options containing packageName and url
   * @returns Promise resolving to launch result
   */
  async launchUpiApp(
    options: LaunchUpiAppOptions
  ): Promise<LaunchUpiAppResult> {
    if (!this.isAvailable()) {
      throw new Error('UpiAppLauncher is only available on Android');
    }

    const { url, packageName = '' } = options;

    if (!url) {
      throw new Error('url is required');
    }

    try {
      const result: LaunchUpiAppNativeResult =
        await NativeUpiAppLauncher.launchUpiApp(packageName, url);

      // Map native result codes to LaunchResult enum
      let launchResult: LaunchResult;
      switch (result.resultCode) {
        case 0:
          launchResult = LaunchResult.Success;
          break;
        case 1:
          launchResult = LaunchResult.Canceled;
          break;
        case 2:
          launchResult = LaunchResult.Failed;
          break;
        default:
          launchResult = LaunchResult.Failed;
      }

      return {
        result: launchResult,
        error: result.error,
      };
    } catch (error) {
      return {
        result: LaunchResult.Error,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export default new UpiAppLauncherModule();
