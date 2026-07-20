// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your screens
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OtpScreen from '../screens/OtpScreen';
import PlannerScreen from '../screens/PlannerScreen';
import LoadingScreen from '../screens/LoadingScreen'; 
import ResultScreen from '../screens/ResultScreen';   

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false, // Hides the default top bar
          animation: 'slide_from_right' // smooth slide animation
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Planner" component={PlannerScreen} />
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="OtpScreen" component={OtpScreen} />



      </Stack.Navigator>
    </NavigationContainer>
  );
}

