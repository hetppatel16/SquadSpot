import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView, // <--- Added ScrollView
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Ensure this matches your import (expo-linear-gradient)
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';

import { styles } from "../styles/LoginStyles";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const handleLogin = () => {
      
      if (email.trim() === '' || password.trim() === '') {
        Alert.alert('Missing Details', 'Please enter both your email and password.');
        return; 
      }

      
      navigation.navigate('Planner');
    };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 1. Background Layer (Kept strictly outside the scroller so it stays still) */}
      <LinearGradient
        colors={['#102217', '#050505']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.glowShape, { top: -100, left: -50, backgroundColor: '#1e3a8a' }]} />
      <View style={[styles.glowShape, { bottom: -100, right: -50, backgroundColor: '#581c87' }]} />

      {/* 2. Keyboard & Scroll Logic */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled" // Allows buttons to be tapped even when keyboard is open
          >
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>SQUAD SPOT</Text>
              <Text style={styles.subtitle}>Plan your next hangout</Text>
            </View>

            {/* Form Section */}
            <View style={styles.form}>

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.glassInput}>
                  <MaterialIcons name="mail-outline" size={22} color="rgba(255,255,255,0.4)" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.glassInput}>
                  <MaterialIcons name="lock-outline" size={22} color="rgba(255,255,255,0.4)" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible} 
                  />
                  
                  <TouchableOpacity 
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    style={styles.eyeButton}
                  >
                    <MaterialIcons 
                      name={isPasswordVisible ? "visibility" : "visibility-off"} 
                      size={22} 
                      color="rgba(255,255,255,0.4)" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotButton}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Main Action Button */}
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>Log In</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#102217" />
              </TouchableOpacity>

            </View>

            {/* Social Login */}
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR CONTINUE WITH</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton}>
                <FontAwesome name="apple" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <FontAwesome name="google" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={()=>navigation.navigate('SignUp')}
              >
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

