import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import FeedbackHost from './src/components/FeedbackHost';
import { installWebStyles } from './src/utils/webStyles';

// Browser-only CSS (focus ring); does nothing on mobile.
installWebStyles();

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        <AppNavigator />
        {/* Web toasts and confirm dialogs; mobile uses native alerts instead. */}
        <FeedbackHost />
      </View>
    </AuthProvider>
  );
}
