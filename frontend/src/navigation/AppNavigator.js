import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, getPathFromState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../context/AuthContext';

// Authentication screens
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OtpScreen from '../screens/OtpScreen';

// Private application screens
import PlannerScreen from '../screens/PlannerScreen';
import LoadingScreen from '../screens/LoadingScreen';
import ResultScreen from '../screens/ResultScreen';

const Stack = createNativeStackNavigator();

// Gives every screen its own browser URL so Back/Forward and bookmarks work on
// web. On mobile the same config handles squadspot:// deep links
// (e.g. squadspot://plan); the `prefixes` entry is ignored on web.
const linking = {
  prefixes: ['squadspot://'],
  config: {
    screens: {
      Login: 'login',
      SignUp: 'signup',
      ForgotPassword: 'forgot-password',
      OtpScreen: 'reset-password',
      Planner: 'plan',
      Loading: 'planning',
      Result: 'trip',
    },
  },
  // Screen data (planner choices, the generated trip, the reset email) stays
  // in memory instead of being written into the address bar as ?query=...
  getPathFromState: (state, options) => getPathFromState(state, options).split('?')[0],
};

// Browser tab titles (web only; mobile ignores documentTitle).
const SCREEN_TITLES = {
  Login: 'Sign in',
  SignUp: 'Create account',
  ForgotPassword: 'Forgot password',
  OtpScreen: 'Reset password',
  Planner: 'Plan your outing',
  Loading: 'Planning your day',
  Result: 'Your trip',
};
const documentTitle = {
  formatter: (options, route) => `${SCREEN_TITLES[route?.name] || 'Plan your outing'} · SquadSpot`,
};

export default function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#102217', '#050505']}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="#0df269" />
      </View>
    );
  }

  return (
    <NavigationContainer independent linking={linking} documentTitle={documentTitle}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {isAuthenticated ? (
          // Private routes only exist while a valid local session is present.
          <>
            <Stack.Screen name="Planner" component={PlannerScreen} />
            <Stack.Screen name="Loading" component={LoadingScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
          </>
        ) : (
          // Authentication routes are shown only to signed-out users.
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="OtpScreen" component={OtpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
