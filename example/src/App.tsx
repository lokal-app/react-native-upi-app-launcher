import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import UpiAppLauncher, {
  LaunchResult,
  type UpiApp,
} from 'react-native-upi-app-launcher';

export default function App() {
  const [apps, setApps] = useState<UpiApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState(
    'upi://pay?pa=merchant@upi&pn=Test%20Merchant&am=100.00&cu=INR&tn=Test%20Payment'
  );
  const [showSubscriptionOnly, setShowSubscriptionOnly] = useState(false);
  const [showCustomUrlModal, setShowCustomUrlModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<UpiApp | null>(null);
  const [customUrlForApp, setCustomUrlForApp] = useState('');

  useEffect(() => {
    loadUpiApps();
  }, []);

  const loadUpiApps = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!UpiAppLauncher.isAvailable()) {
        setError('UPI App Launcher is only available on Android');
        return;
      }

      const installedApps = await UpiAppLauncher.getInstalledUpiApps();
      setApps(installedApps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load UPI apps');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchApp = async (app: UpiApp, url?: string) => {
    const upiUrl = url || customUrl;

    try {
      const result = await UpiAppLauncher.launchUpiApp({
        packageName: app.packageName,
        url: upiUrl,
      });

      console.log('result', result);

      switch (result.result) {
        case LaunchResult.Success:
          Alert.alert('Success', 'Payment completed successfully!');
          break;
        case LaunchResult.Canceled:
          Alert.alert('Canceled', 'Payment was canceled by user');
          break;
        case LaunchResult.Failed:
          Alert.alert(
            'Failed',
            `Payment failed: ${result.error || 'Unknown error'}`
          );
          break;
        case LaunchResult.Error:
          Alert.alert(
            'Error',
            `Error launching app: ${result.error || 'Unknown error'}`
          );
          break;
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to launch app');
    }
  };

  const handleLaunchWithoutPackage = async () => {
    if (!customUrl) {
      Alert.alert('Error', 'Please enter a UPI URL');
      return;
    }

    try {
      const result = await UpiAppLauncher.launchUpiApp({
        url: customUrl,
      });

      switch (result.result) {
        case LaunchResult.Success:
          Alert.alert('Success', 'Payment completed successfully!');
          break;
        case LaunchResult.Canceled:
          Alert.alert('Canceled', 'Payment was canceled by user');
          break;
        case LaunchResult.Failed:
          Alert.alert(
            'Failed',
            `Payment failed: ${result.error || 'Unknown error'}`
          );
          break;
        case LaunchResult.Error:
          Alert.alert(
            'Error',
            `Error launching app: ${result.error || 'Unknown error'}`
          );
          break;
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to launch app');
    }
  };

  const filteredApps = showSubscriptionOnly
    ? apps.filter((app: UpiApp) => app.supportsSubscription)
    : apps;

  const renderAppItem = ({ item }: { item: UpiApp }) => (
    <View style={styles.appCard}>
      <View style={styles.appInfo}>
        {item.icon ? (
          <Image
            source={{ uri: item.icon }}
            style={styles.appIcon}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.appIcon, styles.appIconPlaceholder]}>
            <Text style={styles.appIconText}>
              {item.appName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.appDetails}>
          <Text style={styles.appName}>{item.appName}</Text>
          <Text style={styles.packageName}>{item.packageName}</Text>
          {item.supportsSubscription && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Supports Subscription</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.appActions}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={() => handleLaunchApp(item)}
        >
          <Text style={styles.buttonText}>Launch</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => {
            setSelectedApp(item);
            setCustomUrlForApp(customUrl);
            setShowCustomUrlModal(true);
          }}
        >
          <Text style={styles.buttonTextSecondary}>Custom URL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          This library is only available on Android
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading UPI apps...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={loadUpiApps}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadUpiApps} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>UPI App Launcher</Text>
        <Text style={styles.subtitle}>
          Found {apps.length} UPI {apps.length === 1 ? 'app' : 'apps'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom UPI URL</Text>
        <TextInput
          style={styles.input}
          value={customUrl}
          onChangeText={setCustomUrl}
          placeholder="Enter UPI URL (e.g., upi://pay?pa=merchant@upi&am=100)"
          multiline
        />
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, styles.fullWidthButton]}
          onPress={handleLaunchWithoutPackage}
        >
          <Text style={styles.buttonText}>Launch with URL (Show Chooser)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.filterRow}>
          <Text style={styles.sectionTitle}>Installed UPI Apps</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowSubscriptionOnly(!showSubscriptionOnly)}
          >
            <Text style={styles.filterButtonText}>
              {showSubscriptionOnly
                ? `Show All (${apps.length})`
                : `Subscription Only (${apps.filter((a: UpiApp) => a.supportsSubscription).length})`}
            </Text>
          </TouchableOpacity>
        </View>

        {filteredApps.length === 0 ? (
          <Text style={styles.emptyText}>No UPI apps found</Text>
        ) : (
          <FlatList
            data={filteredApps}
            renderItem={renderAppItem}
            keyExtractor={(item: UpiApp) => item.packageName}
            scrollEnabled={false}
          />
        )}
      </View>

      {showCustomUrlModal && selectedApp && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Custom URL for {selectedApp.appName}</Text>
            <TextInput
              style={styles.modalInput}
              value={customUrlForApp}
              onChangeText={setCustomUrlForApp}
              placeholder="Enter UPI URL"
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setShowCustomUrlModal(false);
                  setSelectedApp(null);
                }}
              >
                <Text style={styles.buttonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={() => {
                  if (customUrlForApp) {
                    handleLaunchApp(selectedApp, customUrlForApp);
                    setShowCustomUrlModal(false);
                    setSelectedApp(null);
                  } else {
                    Alert.alert('Error', 'Please enter a UPI URL');
                  }
                }}
              >
                <Text style={styles.buttonText}>Launch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#F9F9F9',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
  },
  filterButtonText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '600',
  },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  appInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
  },
  appIconPlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  packageName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },
  appActions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  fullWidthButton: {
    flex: 1,
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    margin: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#F9F9F9',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
});
