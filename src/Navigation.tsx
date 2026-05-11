import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from './theme';
import { useStore } from './store';

import DashboardScreen from './screens/DashboardScreen';
import AlertsScreen from './screens/AlertsScreen';
import SettingsScreen from './screens/SettingsScreen';
import LiveViewScreen from './screens/LiveViewScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  LiveView: { boxId: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Alerts: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createMaterialTopTabNavigator<MainTabParamList>();

function MainTabs() {
  const alerts = useStore((state) => state.alerts);
  const activeAlerts = alerts.filter(a => a.status === 'active');
  const theme = useAppTheme();

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      screenOptions={({ route }) => ({
        swipeEnabled: true,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: theme.spacing.xs,
          justifyContent: 'center',
        },
        tabBarActiveTintColor: theme.colors.primaryActive,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarIndicatorStyle: {
          backgroundColor: theme.colors.primaryActive,
          height: 3,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return (
            <React.Fragment>
              <Ionicons name={iconName} size={24} color={color} />
              {route.name === 'Alerts' && activeAlerts.length > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: theme.colors.danger,
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                    {activeAlerts.length > 99 ? '99+' : activeAlerts.length}
                  </Text>
                </View>
              )}
            </React.Fragment>
          );
        },
        tabBarShowLabel: false, // We'll just show icons like a standard app to keep it clean
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const theme = useAppTheme();
  const themeMode = useStore((state) => state.themeMode);

  const navigationTheme = useMemo(() => {
    const baseTheme = themeMode === 'light' ? DefaultTheme : DarkTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
      },
    };
  }, [themeMode, theme.colors]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen 
          name="LiveView" 
          component={LiveViewScreen} 
          options={{ presentation: 'modal' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
