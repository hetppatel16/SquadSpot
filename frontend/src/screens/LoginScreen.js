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
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import { loginUser, oauthLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { styles } from "../styles/LoginStyles";
import { GOOGLE_AUTH_CONFIG } from '../constants/authConfig';
import ResponsiveContainer from '../components/ResponsiveContainer';

// Completes the authentication routing redirect loop properly back onto mobile screens
WebBrowser.maybeCompleteAuthSession();

// Local inline utility function to completely avoid file import bugs
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
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(val => setIsAppleAvailable(val))
      .catch(() => setIsAppleAvailable(false));
  }, []);

  // Use the app's registered scheme so the provider can return to the app.
  const googleRedirectUri = AuthSession.makeRedirectUri({
    scheme: 'squadspot',
    path: 'oauthredirect',
  });
  const googleClientId = Platform.select({
    android: GOOGLE_AUTH_CONFIG.androidClientId,
    ios: GOOGLE_AUTH_CONFIG.iosClientId,
    default: GOOGLE_AUTH_CONFIG.webClientId,
  });

  // This hook requests an ID token (directly on web and through the native
  // authorization-code exchange on installed iOS/Android builds).
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: GOOGLE_AUTH_CONFIG.androidClientId,
    iosClientId: GOOGLE_AUTH_CONFIG.iosClientId,
    webClientId: GOOGLE_AUTH_CONFIG.webClientId,
    redirectUri: googleRedirectUri,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
  });

  // Listen for active Google session authorization success responses
  useEffect(() => {
    if (response?.type === 'success') {
      const authObj = response.authentication || {};
      const paramsObj = response.params || {};

      const idToken = authObj.idToken || authObj.id_token || paramsObj.id_token || paramsObj.idToken || null;
      const accessToken = authObj.accessToken || authObj.access_token || paramsObj.access_token || paramsObj.accessToken || null;

      handleBackendOAuth('google', idToken, accessToken);
    }
  }, [response]);

  // Handshake function communicating provider identity keys down to FastAPI
  const handleBackendOAuth = async (provider, idToken, accessToken, nonce = null, fullName = null) => {
    if (!idToken) {
      const message = `${provider} did not return an identity token. Please try again.`;
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Authentication Failed', message);
      return;
    }
    setIsOAuthLoading(true);
    try {
      const data = await oauthLogin(provider, idToken, accessToken, nonce, fullName);
      if (login) {
        await login(data.user, data.token, data.refresh_token, data.expires_at);
      }
      // Auth state change switches AppNavigator to the private routes.
    } catch (error) {
      console.error(`${provider} OAuth Handshake Error:`, error);
      const msg = error.message || `${provider} authentication failed.`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Authentication Failed', msg);
      }
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const handleGooglePress = () => {
    if (!googleClientId || googleClientId.includes('YOUR_')) {
      const message = 'Google Sign-In is not configured for this platform. Add its OAuth client ID first.';
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Google Sign-In Unavailable', message);
      return;
    }
    if (!request) {
      const message = 'Google Sign-In is still initializing. Please try again in a moment.';
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Please Wait', message);
      return;
    }
    promptAsync();
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
    setIsLoading(true);
    try {
      const response = await loginUser({ email: trimmedEmail, password });
      if (login) {
        await login(response.user, response.token, response.refresh_token, response.expires_at);
      }
      // Auth state change switches AppNavigator to the private routes.
    } catch (error) {
      if (Platform.OS === 'web') window.alert(error.message || 'Login failed.');
      else Alert.alert('Login Failed', error.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#102217', '#050505']} style={StyleSheet.absoluteFillObject} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Platform.OS === 'web' ? null : Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <ResponsiveContainer>
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
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
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

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading || isOAuthLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#102217" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                    <MaterialIcons name="arrow-forward" size={22} color="#102217" />
                  </>
                )}
              </TouchableOpacity>

              {/* Social Login Divider Grid Row */}
              <View style={{ marginVertical: 20, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 15 }}>Or continue with</Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', gap: 16 }}>
                  {/* Google Login Button */}
                  <TouchableOpacity 
                    disabled={!request || isOAuthLoading || isLoading}
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.08)', 
                      paddingVertical: 12, 
                      paddingHorizontal: 24, 
                      borderRadius: 25, 
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 48,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.15)',
                      gap: 10,
                      opacity: (!request || isOAuthLoading || isLoading) ? 0.7 : 1
                    }} 
                    onPress={handleGooglePress}
                  >
                    {isOAuthLoading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <FontAwesome name="google" size={18} color="#db4437" />
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Google</Text>
                      </>
                    )}
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
                          const randomBytes = await Crypto.getRandomBytesAsync(32);
                          const rawNonce = Array.from(randomBytes)
                            .map((byte) => byte.toString(16).padStart(2, '0'))
                            .join('');
                          const hashedNonce = await Crypto.digestStringAsync(
                            Crypto.CryptoDigestAlgorithm.SHA256,
                            rawNonce
                          );
                          const credential = await AppleAuthentication.signInAsync({
                            nonce: hashedNonce,
                            requestedScopes: [
                              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                              AppleAuthentication.AppleAuthenticationScope.EMAIL,
                            ],
                          });
                          const appleFullName = credential.fullName
                            ? [credential.fullName.givenName, credential.fullName.middleName, credential.fullName.familyName]
                                .filter(Boolean)
                                .join(' ')
                            : null;
                          handleBackendOAuth('apple', credential.identityToken, null, rawNonce, appleFullName);
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
            </ResponsiveContainer>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}