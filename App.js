import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import BlockHeightScreen from './screens/BlockHeightScreen';
import PriceScreen from './screens/PriceScreen';
import MiningScreen from './screens/MiningScreen';
import SupplyScreen from './screens/SupplyScreen';
import MempoolScreen from './screens/MempoolScreen';
import LightningScreen from './screens/LightningScreen';
import DeviceSetupScreen from './screens/DeviceSetupScreen';

const Tab = createBottomTabNavigator();

const THEME = {
  background: '#1a1a1a',
  surface: '#2a2a2a',
  primary: '#f7931a',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  border: '#3a3a3a',
};

function TabIcon({ icon }) {
  return <Text style={{ fontSize: 22 }}>{icon}</Text>;
}

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: THEME.primary,
            background: THEME.background,
            card: THEME.surface,
            text: THEME.text,
            border: THEME.border,
            notification: THEME.primary,
          },
          fonts: DefaultTheme.fonts,
        }}
      >
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: THEME.primary,
            tabBarInactiveTintColor: THEME.textSecondary,
            tabBarStyle: {
              backgroundColor: THEME.surface,
              borderTopColor: THEME.border,
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 8,
            },
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '600',
            },
            headerStyle: {
              backgroundColor: THEME.surface,
              borderBottomColor: THEME.border,
              borderBottomWidth: 1,
            },
            headerTintColor: THEME.text,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          }}
        >
          <Tab.Screen
            name="Block"
            component={BlockHeightScreen}
            options={{
              tabBarLabel: 'Block',
              tabBarIcon: () => <TabIcon icon={'\uD83D\uDCE6'} />,
              title: 'Block Height',
            }}
          />
          <Tab.Screen
            name="Price"
            component={PriceScreen}
            options={{
              tabBarLabel: 'Price',
              tabBarIcon: () => <TabIcon icon={'\uD83D\uDCB0'} />,
              title: 'Bitcoin Price',
            }}
          />
          <Tab.Screen
            name="Mining"
            component={MiningScreen}
            options={{
              tabBarLabel: 'Mining',
              tabBarIcon: () => <TabIcon icon={'\u26CF\uFE0F'} />,
              title: 'Mining',
            }}
          />
          <Tab.Screen
            name="Supply"
            component={SupplyScreen}
            options={{
              tabBarLabel: 'Supply',
              tabBarIcon: () => <TabIcon icon={'\uD83D\uDCCA'} />,
              title: 'Supply',
            }}
          />
          <Tab.Screen
            name="Mempool"
            component={MempoolScreen}
            options={{
              tabBarLabel: 'Mempool',
              tabBarIcon: () => <TabIcon icon={'\uD83D\uDD04'} />,
              title: 'Mempool',
            }}
          />
          <Tab.Screen
            name="Lightning"
            component={LightningScreen}
            options={{
              tabBarLabel: 'Lightning',
              tabBarIcon: () => <TabIcon icon={'\u26A1'} />,
              title: 'Lightning',
            }}
          />
          <Tab.Screen
            name="Setup"
            component={DeviceSetupScreen}
            options={{
              tabBarLabel: 'Setup',
              tabBarIcon: () => <TabIcon icon={'\u2699\uFE0F'} />,
              title: 'Device Setup',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
