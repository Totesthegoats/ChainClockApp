import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './styles';
import BLEProvisioningScreen from './BLEProvisioningScreen';
import SettingsScreen from './SettingsScreen';

const TABS = [
  { key: 'wifi', label: 'WiFi Setup', icon: '\uD83D\uDCF6' },
  { key: 'display', label: 'Display', icon: '\uD83D\uDDA5\uFE0F' },
];

export default function DeviceSetupScreen() {
  const [activeTab, setActiveTab] = useState('wifi');

  return (
    <View style={s.container}>
      {/* Segment Control */}
      <View style={s.segmentWrap}>
        <View style={s.segmentBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={s.segmentBtn}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <LinearGradient
                    colors={['#f7931a', '#e8850f']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.segmentActive}
                  >
                    <Text style={s.segmentIcon}>{tab.icon}</Text>
                    <Text style={s.segmentTextActive}>{tab.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={s.segmentInactive}>
                    <Text style={s.segmentIcon}>{tab.icon}</Text>
                    <Text style={s.segmentTextInactive}>{tab.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      <View style={s.content}>
        {activeTab === 'wifi' ? <BLEProvisioningScreen /> : <SettingsScreen />}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  segmentWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: COLORS.background,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentBtn: {
    flex: 1,
  },
  segmentActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentIcon: {
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  segmentTextInactive: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});
