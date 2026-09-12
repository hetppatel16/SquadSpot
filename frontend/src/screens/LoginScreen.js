import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StatusBar, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
  StyleSheet
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';

import { loginUser, oauthLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { styles } from "../styles/LoginStyles";

// Completes the authentication routing redirect loop properly back onto mobile screens
WebBrowser.maybeCompleteAuthSession();

const validateEmailInline = (text) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(text);
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(val => setIsAppleAvailable(val))
      .catch(() => setIsAppleAvailable(false));
  }, []);

  // Configure Client IDs from your Google Cloud Console registry credentials
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  });

  // Listen for active Google session authorization success responses
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token, access_token } = response.authentication;
      handleBackendOAuth('google', id_token, access_token);
    }
  }, [response]);

  const handleBackendOAuth = async (provider, idToken, accessToken) => {
    try {
      setIsSubmitting(true);
      const data = await oauthLogin(provider, idToken, accessToken);
      await login(data.user, data.token || null);
      navigation.replace('Planner');
    } catch (error) {
      console.error(`${provider} OAuth Error:`, error);
      const msg = error.message || 'Social Authentication failed.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Authentication Failed', msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (trimmedEmail === '' || password.trim() === '') {
      if (Platform.OS === 'web') window.alert('Both email and password are required.');
      else Alert.alert('Missing Details', 'Both email and password are required.');
      return; 
    }
    if (!validateEmailInline(trimmedEmail)) {
      if (Platform.OS === 'web') window.alert('Please enter a valid email structure.');
      else Alert.alert('Invalid Email', 'Please enter a valid email structure.');
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await loginUser({ email: trimmedEmail, password });
      await login(response.user, response.token || null);
      navigation.replace('Planner');
    } catch (error) {
      if (Platform.OS === 'web') window.alert(error.message || 'Login failed.');
      else Alert.alert('Login Failed', error.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#102217', '#050505']} style={StyleSheet.absoluteFillObject} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Platform.OS === 'web' ? null : Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.headerContainer}>
              <Text style={styles.title}>SquadSpot</Text>
              <Text style={styles.subtitle}>Welcome back! Sign in to continue</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.glassInput}>
                  <MaterialIcons name="mail-outline" size={22} color="rgba(255,255,255,0.4)" style={styles.icon} />
                  <TextInput style={styles.input} placeholder="name@example.com" placeholderTextColor="rgba(255,255,255,0.3)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress"/>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.label}>Password</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={{ color: '#0df269', fontSize: 13, fontWeight: '500' }}>Forgot?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.glassInput}>
                  <MaterialIcons name="lock-outline" size={22} color="rgba(255,255,255,0.4)" style={styles.icon} />
                  <TextInput style={styles.input} placeholder="Enter your password" placeholderTextColor="rgba(255,255,255,0.3)" value={password} onChangeText={setPassword} secureTextEntry={!isPasswordVisible} autoCapitalize="none" autoComplete="current-password" textContentType="password"/>
                  <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeButton}>
                    <MaterialIcons name={isPasswordVisible ? "visibility" : "visibility-off"} size={22} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={[styles.loginButton, isSubmitting && { opacity: 0.7 }]} onPress={handleLogin} disabled={isSubmitting}>
                <Text style={styles.loginButtonText}>{isSubmitting ? 'Signing In...' : 'Sign In'}</Text>
                <MaterialIcons name="arrow-forward" size={22} color="#102217" />
              </TouchableOpacity>

              {/* Social Login Divider Grid Row */}
              <View style={{ marginVertical: 20, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 15 }}>Or continue with</Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', gap: 16 }}>
                  {/* Google Login Button */}
                  <TouchableOpacity 
                    disabled={!request || isSubmitting}
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.08)', 
                      paddingVertical: 12, 
                      paddingHorizontal: 24, 
                      borderRadius: 25, 
                      flexDirection: 'row',
                      alignItems: 'center',
                      height: 48,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.15)',
                      gap: 10
                    }} 
                    onPress={() => promptAsync()}
                  >
                    <FontAwesome name="google" size={18} color="#db4437" />
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Google</Text>
                  </TouchableOpacity>

                  {/* Apple Login Button */}
                  {isAppleAvailable && Platform.OS === 'ios' ? (
                    <AppleAuthentication.AppleAuthenticationButton
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                      cornerRadius={25}
                      style={{ width: 140, height: 48 }}
                      onPress={async () => {
                        try {
                          const credential = await AppleAuthentication.signInAsync({
                            requestedScopes: [
                              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                              AppleAuthentication.AppleAuthenticationScope.EMAIL,
                            ],
                          });
                          handleBackendOAuth('apple', credential.identityToken, null);
                        } catch (e) {
                          if (e.code !== 'ERR_REQUEST_CANCELED') {
                            Alert.alert('Apple Auth Error', e.message);
                          }
                        }
                      }}
                    />
                  ) : (
                    <TouchableOpacity 
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.08)', 
                        paddingVertical: 12, 
                        paddingHorizontal: 24, 
                        borderRadius: 25, 
                        flexDirection: 'row',
                        alignItems: 'center',
                        height: 48,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.15)',
                        gap: 10
                      }} 
                      onPress={() => {
                        const alertMsg = "Apple Sign-in is only supported on Apple iOS devices.";
                        if (Platform.OS === 'web') {
                          window.alert(alertMsg);
                        } else {
                          Alert.alert('Not Supported', alertMsg);
                        }
                      }}
                    >
                      <FontAwesome name="apple" size={18} color="#ffffff" />
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Apple</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}