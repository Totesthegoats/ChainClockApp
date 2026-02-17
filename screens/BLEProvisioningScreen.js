import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BleManager } from 'react-native-ble-plx';
import { COLORS } from './styles';

const DEVICE_NAME = 'ChoclChain';
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const SSID_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const PASS_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';
const STATUS_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26aa';

function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function PulsingDot({ color, size = 12 }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={{ width: size + 8, height: size + 8, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size + 8,
          height: size + 8,
          borderRadius: (size + 8) / 2,
          backgroundColor: color,
          opacity: Animated.multiply(pulseAnim, 0.25),
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export default function BLEProvisioningScreen() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [wifiStatus, setWifiStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const managerRef = useRef(null);
  const deviceRef = useRef(null);
  const subscriptionRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    managerRef.current = new BleManager();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    return () => {
      subscriptionRef.current?.remove();
      deviceRef.current?.cancelConnection().catch(() => {});
      managerRef.current?.destroy();
    };
  }, [fadeAnim]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version;
      if (apiLevel >= 31) {
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        return (
          results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' &&
          results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted'
        );
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return result === 'granted';
      }
    }
    return true;
  };

  const scanAndConnect = async () => {
    setError(null);
    setWifiStatus(null);

    const permitted = await requestPermissions();
    if (!permitted) {
      setError('Bluetooth permissions are required to scan for devices.');
      return;
    }

    const state = await managerRef.current.state();
    if (state !== 'PoweredOn') {
      setError('Please enable Bluetooth on your device.');
      return;
    }

    setConnectionStatus('scanning');

    managerRef.current.startDeviceScan(null, null, async (err, device) => {
      if (err) {
        setError(err.message);
        setConnectionStatus('disconnected');
        managerRef.current.stopDeviceScan();
        return;
      }

      if (device?.name === DEVICE_NAME || device?.localName === DEVICE_NAME) {
        managerRef.current.stopDeviceScan();

        try {
          const connected = await device.connect({ timeout: 10000 });
          const discovered = await connected.discoverAllServicesAndCharacteristics();
          deviceRef.current = discovered;
          setConnectionStatus('connected');
        } catch (connectErr) {
          setError('Failed to connect: ' + connectErr.message);
          setConnectionStatus('disconnected');
        }
      }
    });

    setTimeout(() => {
      managerRef.current?.stopDeviceScan();
      setConnectionStatus((prev) => {
        if (prev === 'scanning') {
          setError('Device not found. Make sure ChoclChain is powered on and nearby.');
          return 'disconnected';
        }
        return prev;
      });
    }, 15000);
  };

  const disconnect = async () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    if (deviceRef.current) {
      await deviceRef.current.cancelConnection().catch(() => {});
      deviceRef.current = null;
    }
    setConnectionStatus('disconnected');
    setWifiStatus(null);
  };

  const sendCredentials = async () => {
    if (!ssid.trim()) {
      setError('Please enter a WiFi network name.');
      return;
    }
    if (!deviceRef.current) {
      setError('Not connected to device.');
      return;
    }

    setError(null);
    setSending(true);
    setWifiStatus(null);

    try {
      subscriptionRef.current?.remove();
      subscriptionRef.current = deviceRef.current.monitorCharacteristicForService(
        SERVICE_UUID,
        STATUS_CHAR_UUID,
        (err, characteristic) => {
          if (err) return;
          if (characteristic?.value) {
            const status = fromBase64(characteristic.value);
            setWifiStatus(status.trim());
          }
        },
      );

      await deviceRef.current.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        SSID_CHAR_UUID,
        toBase64(ssid),
      );

      await deviceRef.current.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        PASS_CHAR_UUID,
        toBase64(password),
      );
    } catch (writeErr) {
      setError('Failed to send credentials: ' + writeErr.message);
    } finally {
      setSending(false);
    }
  };

  const statusConfig = {
    CONNECTING: { color: COLORS.warning, text: 'Connecting to WiFi...', icon: '...' },
    CONNECTED: { color: COLORS.success, text: 'Successfully connected!', icon: '\u2713' },
    FAILED: { color: COLORS.error, text: 'Connection failed. Check credentials.', icon: '\u2717' },
  };

  const statusIndicator = {
    disconnected: { color: '#666', label: 'No Device', sub: 'Tap below to scan' },
    scanning: { color: COLORS.warning, label: 'Scanning', sub: 'Looking for ChoclChain...' },
    connected: { color: COLORS.success, label: 'Connected', sub: 'ChoclChain' },
  };

  const current = statusIndicator[connectionStatus];

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Device Status Hero */}
        <View style={s.heroCard}>
          <LinearGradient
            colors={['#222', '#1a1a1a']}
            style={s.heroGradient}
          >
            <View style={s.heroIconWrap}>
              <View style={[
                s.heroIconCircle,
                { borderColor: current.color },
                connectionStatus === 'connected' && { shadowColor: COLORS.success, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
              ]}>
                <Text style={s.heroIcon}>
                  {connectionStatus === 'connected' ? '\u26A1' : '\uD83D\uDD17'}
                </Text>
              </View>
              {connectionStatus === 'scanning' && (
                <ActivityIndicator
                  size="large"
                  color={COLORS.primary}
                  style={{ position: 'absolute' }}
                />
              )}
            </View>

            <View style={s.heroStatusRow}>
              <PulsingDot color={current.color} />
              <Text style={[s.heroLabel, { color: current.color }]}>{current.label}</Text>
            </View>
            <Text style={s.heroSub}>{current.sub}</Text>
          </LinearGradient>
        </View>

        {/* Action Button */}
        {connectionStatus === 'disconnected' && (
          <TouchableOpacity onPress={scanAndConnect} activeOpacity={0.85}>
            <LinearGradient
              colors={['#f7931a', '#e8850f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.primaryBtn}
            >
              <Text style={s.primaryBtnIcon}>{'\uD83D\uDCF6'}</Text>
              <Text style={s.primaryBtnText}>Scan for Device</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {connectionStatus === 'connected' && (
          <TouchableOpacity style={s.disconnectBtn} onPress={disconnect} activeOpacity={0.85}>
            <Text style={s.disconnectBtnText}>Disconnect</Text>
          </TouchableOpacity>
        )}

        {/* Error */}
        {error && (
          <View style={s.errorCard}>
            <Text style={s.errorIcon}>{'\u26A0'}</Text>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* WiFi Credentials Form */}
        {connectionStatus === 'connected' && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardHeaderIcon}>{'\uD83D\uDCF6'}</Text>
              <Text style={s.cardTitle}>WiFi Configuration</Text>
            </View>

            <Text style={s.inputLabel}>Network Name (SSID)</Text>
            <View style={s.inputWrap}>
              <TextInput
                style={s.input}
                placeholder="Enter WiFi name"
                placeholderTextColor="#555"
                value={ssid}
                onChangeText={setSsid}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={s.inputLabel}>Password</Text>
            <View style={s.inputWrap}>
              <TextInput
                style={[s.input, { paddingRight: 56 }]}
                placeholder="Enter WiFi password"
                placeholderTextColor="#555"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={s.showToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={s.showToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={sendCredentials}
              disabled={sending}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={sending ? ['#555', '#444'] : ['#f7931a', '#e8850f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.sendBtn}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={s.sendBtnIcon}>{'\u2191'}</Text>
                    <Text style={s.sendBtnText}>Send Credentials</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* WiFi Status Feedback */}
        {wifiStatus && statusConfig[wifiStatus] && (
          <View style={[s.statusCard, { borderColor: statusConfig[wifiStatus].color }]}>
            <View style={s.statusCardInner}>
              <View style={[s.statusBadge, { backgroundColor: statusConfig[wifiStatus].color }]}>
                <Text style={s.statusBadgeText}>{statusConfig[wifiStatus].icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.statusTitle, { color: statusConfig[wifiStatus].color }]}>
                  {wifiStatus}
                </Text>
                <Text style={s.statusMsg}>{statusConfig[wifiStatus].text}</Text>
              </View>
            </View>
            {wifiStatus === 'CONNECTING' && (
              <View style={s.statusProgress}>
                <LinearGradient
                  colors={[COLORS.warning, '#f7931a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.statusProgressBar}
                />
              </View>
            )}
          </View>
        )}

        {/* Help Card */}
        {connectionStatus === 'disconnected' && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardHeaderIcon}>{'\u2139\uFE0F'}</Text>
              <Text style={s.cardTitle}>Getting Started</Text>
            </View>
            {[
              { step: '1', text: 'Power on your ChoclChain device' },
              { step: '2', text: 'Enable Bluetooth on your phone' },
              { step: '3', text: 'Tap "Scan for Device" above' },
              { step: '4', text: 'Enter your WiFi credentials' },
              { step: '5', text: 'Send to configure the device' },
            ].map((item) => (
              <View key={item.step} style={s.stepRow}>
                <View style={s.stepBadge}>
                  <Text style={s.stepNum}>{item.step}</Text>
                </View>
                <Text style={s.stepText}>{item.text}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Hero card
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroGradient: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    fontSize: 28,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  heroLabel: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  primaryBtnIcon: {
    fontSize: 20,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  disconnectBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.error,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  disconnectBtnText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: 15,
  },

  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1a1a',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3a2020',
    gap: 10,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },

  // Cards
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  cardHeaderIcon: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Inputs
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#111',
    color: COLORS.text,
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  showToggle: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  showToggleText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Send button
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendBtnIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Status card
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statusCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusMsg: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusProgress: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginTop: 14,
    overflow: 'hidden',
  },
  statusProgressBar: {
    width: '60%',
    height: '100%',
    borderRadius: 2,
  },

  // Steps
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 14,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  stepText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    flex: 1,
  },
});
