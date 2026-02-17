import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sharedStyles, COLORS } from './styles';

const STORAGE_KEY = '@esp32_ip';

function isValidIP(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => {
    const n = Number(p);
    return Number.isInteger(n) && n >= 0 && n <= 255 && p === String(n);
  });
}

export default function SettingsScreen() {
  const [ipAddress, setIpAddress] = useState('');
  const [savedIp, setSavedIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) {
        setIpAddress(val);
        setSavedIp(val);
      }
    }).catch(() => {});
  }, []);

  const testConnection = async () => {
    if (!ipAddress) {
      Alert.alert('Error', 'Please enter ESP32 IP address');
      return;
    }
    if (!isValidIP(ipAddress)) {
      Alert.alert('Error', 'Invalid IP format. Use XXX.XXX.XXX.XXX');
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`http://${ipAddress}/status`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        setConnected(true);
        setCurrentPage(data.page || 0);
        setSavedIp(ipAddress);
        await AsyncStorage.setItem(STORAGE_KEY, ipAddress);
        Alert.alert('Success', 'Connected to ESP32!');
      } else {
        setConnected(false);
        Alert.alert('Error', 'Could not connect to ESP32');
      }
    } catch (err) {
      clearTimeout(timeout);
      setConnected(false);
      Alert.alert('Error', 'Connection failed. Check IP address and network.');
    } finally {
      setLoading(false);
    }
  };

  const changePage = async (page) => {
    if (!savedIp) {
      Alert.alert('Error', 'Not connected to ESP32');
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`http://${savedIp}/setpage?page=${page}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        setCurrentPage(page);
        Alert.alert('Success', `Display changed to Page ${page}`);
      } else {
        Alert.alert('Error', 'Failed to change page');
      }
    } catch (err) {
      clearTimeout(timeout);
      Alert.alert('Error', 'Failed to communicate with ESP32');
    } finally {
      setLoading(false);
    }
  };

  const pages = [
    { num: 0, name: 'Block Height', icon: '\uD83D\uDCE6' },
    { num: 1, name: 'Price', icon: '\uD83D\uDCB0' },
    { num: 2, name: 'Mining', icon: '\u26CF\uFE0F' },
    { num: 3, name: 'Supply', icon: '\uD83D\uDCCA' },
    { num: 4, name: 'Mempool', icon: '\uD83D\uDD04' },
    { num: 5, name: 'Lightning', icon: '\u26A1' },
  ];

  return (
    <ScrollView
      style={sharedStyles.container}
      contentContainerStyle={sharedStyles.scrollContent}
    >
      <Text style={[sharedStyles.sectionHeader, { marginTop: 0 }]}>
        ESP32 CONNECTION
      </Text>

      <View style={sharedStyles.card}>
        <Text style={sharedStyles.label}>ESP32 IP Address</Text>
        <TextInput
          style={{
            backgroundColor: COLORS.background,
            color: COLORS.text,
            padding: 12,
            borderRadius: 8,
            marginTop: 8,
            marginBottom: 16,
            fontSize: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
          placeholder="192.168.1.100"
          placeholderTextColor={COLORS.textSecondary}
          value={ipAddress}
          onChangeText={setIpAddress}
          keyboardType="numeric"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={{
            backgroundColor: connected ? COLORS.success : COLORS.primary,
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={testConnection}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              {connected ? '\u2713 Connected' : 'Connect to ESP32'}
            </Text>
          )}
        </TouchableOpacity>

        {connected && (
          <View style={{ marginTop: 16, padding: 12, backgroundColor: COLORS.background, borderRadius: 8 }}>
            <Text style={sharedStyles.cardSubtitle}>
              Connected to: {savedIp}
            </Text>
            <Text style={sharedStyles.cardSubtitle}>
              Current page: {currentPage}
            </Text>
          </View>
        )}
      </View>

      {connected && (
        <>
          <Text style={sharedStyles.sectionHeader}>CHANGE DISPLAY PAGE</Text>

          <View style={sharedStyles.card}>
            <Text style={[sharedStyles.cardSubtitle, { marginBottom: 16 }]}>
              Select which page to show on the e-ink display
            </Text>

            {pages.map((page) => (
              <TouchableOpacity
                key={page.num}
                style={{
                  padding: 16,
                  marginBottom: 12,
                  borderRadius: 8,
                  backgroundColor: currentPage === page.num ? COLORS.primary : COLORS.background,
                  borderWidth: 2,
                  borderColor: currentPage === page.num ? COLORS.primary : COLORS.border,
                }}
                onPress={() => changePage(page.num)}
                disabled={loading}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 24, marginRight: 12 }}>{page.icon}</Text>
                    <View>
                      <Text style={[
                        sharedStyles.value,
                        { color: currentPage === page.num ? '#000' : COLORS.text },
                      ]}>
                        Page {page.num}
                      </Text>
                      <Text style={[
                        sharedStyles.cardSubtitle,
                        { color: currentPage === page.num ? '#333' : COLORS.textSecondary },
                      ]}>
                        {page.name}
                      </Text>
                    </View>
                  </View>
                  {currentPage === page.num && (
                    <Text style={{ fontSize: 20, color: '#000' }}>{'\u2713'}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {!connected && (
        <View style={[sharedStyles.card, { marginTop: 0 }]}>
          <Text style={sharedStyles.cardTitle}>How to Find ESP32 IP Address</Text>
          <Text style={[sharedStyles.cardSubtitle, { marginTop: 8 }]}>
            1. Open Serial Monitor in Arduino IDE{'\n'}
            2. Reset the ESP32{'\n'}
            3. Look for "IP: 192.168.x.x" in the output{'\n'}
            4. Enter that IP address above
          </Text>
        </View>
      )}

      <View style={[sharedStyles.card, { marginTop: connected ? 0 : 0 }]}>
        <Text style={sharedStyles.cardTitle}>Requirements</Text>
        <Text style={[sharedStyles.cardSubtitle, { marginTop: 8 }]}>
          {'\u2022'} Phone and ESP32 on same WiFi network{'\n'}
          {'\u2022'} ESP32 web server running (port 80){'\n'}
          {'\u2022'} Firmware with web server support
        </Text>
      </View>
    </ScrollView>
  );
}
