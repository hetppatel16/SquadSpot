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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102217', 
  },
  glowShape: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.4,
  },
  // ---> NEW LOGIC HERE <---
  scrollContent: {
    flexGrow: 1, // This is the magic property. It tells the scrollview to fill the screen, but stretch if needed.
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40, // Adds breathing room at the top/bottom when scrolling
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800', 
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
  },
  form: {
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 12,
  },
  glassInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    height: 60,
    borderRadius: 30, 
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    height: '100%',
  },
  eyeButton: {
    padding: 8,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#0df269', 
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0df269',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  loginButtonText: {
    color: '#102217',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  orText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: 'bold',
    marginHorizontal: 16,
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 40,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
  },
  signUpText: {
    color: '#0df269',
    fontSize: 15,
    fontWeight: 'bold',
  },
});