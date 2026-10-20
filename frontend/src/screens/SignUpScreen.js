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

import { signUpUser, oauthLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { notify } from '../utils/feedback';
import { styles } from "../styles/SignUpStyles";
import { GOOGLE_AUTH_CONFIG } from '../constants/authConfig';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { useGoogleWebNonce } from '../utils/googleNonce';

WebBrowser.maybeCompleteAuthSession();

// Self-contained inline utility functions to eliminate folder resolution crashes
const validateEmailInline = (text) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(text);
};

const validatePasswordInline = (password) => {
  const errors = [];
  if (password.length < 8) errors.push("At least 8 characters long");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("One number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("One special character (@, #, $, %, etc.)");
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default function SignUpScreen({ navigation }) {
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(val => setIsAppleAvailable(val))
      .catch(() => setIsAppleAvailable(false));
  }, []);

  // Keep Google sign-in identical on signup and login: both flows need an
  // ID token so Supabase can verify the user's identity on the backend.
  const googleRedirectUri = AuthSession.makeRedirectUri({
    scheme: 'squadspot',
    path: 'oauthredirect',
  });
  const googleClientId = Platform.select({
    android: GOOGLE_AUTH_CONFIG.androidClientId,
    ios: GOOGLE_AUTH_CONFIG.iosClientId,
    default: GOOGLE_AUTH_CONFIG.webClientId,
  });

  const googleNonce = useGoogleWebNonce();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: GOOGLE_AUTH_CONFIG.androidClientId,
    iosClientId: GOOGLE_AUTH_CONFIG.iosClientId,
    webClientId: GOOGLE_AUTH_CONFIG.webClientId,
    redirectUri: googleRedirectUri,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
    extraParams: googleNonce.extraParams,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const authObj = response.authentication || {};
      const paramsObj = response.params || {};

      const idToken = authObj.idToken || authObj.id_token || paramsObj.id_token || paramsObj.idToken || null;
      const accessToken = authObj.accessToken || authObj.access_token || paramsObj.access_token || paramsObj.accessToken || null;

      handleBackendOAuth('google', idToken, accessToken, googleNonce.raw);
    }
  }, [response]);

  const handleBackendOAuth = async (provider, idToken, accessToken, nonce = null, fullName = null) => {
    if (!idToken) {
      const message = `${provider} did not return an identity token. Please try again.`;
      notify('Authentication Failed', message);
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
      notify('Authentication Failed', msg);
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const handleGooglePress = () => {
    if (!googleClientId || googleClientId.includes('YOUR_')) {
      const message = 'Google Sign-In is not configured for this platform. Add its OAuth client ID first.';
      notify('Google Sign-In Unavailable', message);
      return;
    }
    // On web the request must carry our nonce (see utils/googleNonce.js).
    if (!request || (Platform.OS === 'web' && !googleNonce.raw)) {
      const message = 'Google Sign-In is still initializing. Please try again in a moment.';
      notify('Please Wait', message, 'info');
      return;
    }
    promptAsync();
  };

  const handleSignUp = async () => {
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedFullName = fullName.trim();

    // 1. Check for blank fields
    if (!trimmedFullName || !trimmedEmail || !trimmedPhone || !password.trim() || !confirmPassword.trim()) {
      notify('Validation Error', 'All fields are mandatory.');
      return;
    }

    // 2. Validate structural layout email
    if (!validateEmailInline(trimmedEmail)) {
      notify('Validation Error', 'Please enter a valid structural email address.');
      return;
    }

    // 3. Verify phone number length
    if (trimmedPhone.length !== 10) {
      notify('Validation Error', 'Please enter a valid 10-digit phone number.');
      return;
    }

    // 4. Confirm match strings
    if (password !== confirmPassword) {
      notify('Validation Error', 'Passwords do not match!');
      return;
    }

    // 5. Run Strict Security Rules Engine
    const passwordValidation = validatePasswordInline(password);
    if (!passwordValidation.isValid) {
      const errorMsg = "Password must include:\n" + passwordValidation.errors.map(e => `• ${e}`).join('\n');
      notify('Weak Password', errorMsg);
      return;
    }

    try {
      setIsLoading(true);
      const response = await signUpUser({
        name: trimmedFullName,
        email: trimmedEmail,
        password: password,
        phone: trimmedPhone
      });
      // Web and mobile both use Bearer tokens (the cookie design was rolled
      // back). Supabase returns tokens only when email confirmation is off.
      const hasSession = response.user && response.token && response.refresh_token;

      if (hasSession) {
        await login(
          response.user,
          response.token,
          response.refresh_token,
          response.expires_at
        );
      } else {
        notify(
          'Account Created',
          'Account created. Please check your email and confirm your account before logging in.',
          'success'
        );
        navigation.navigate('Login');
      }
    } catch (error) {
      notify('Registration Failed', error.message || 'Registration failed.');
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
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join SquadSpot to start planning</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.glassInput}>
                  <MaterialIcons name="person-outline" size={22} color="rgba(255,255,255,0.4)" style={styles.icon} />
                  <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="rgba(255,255,255,0.3)" value={fullName} onChangeText={setFullName} autoComplete="name" textContentType="name"/>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.glassInput}>
                  <MaterialIcons name="mail-outline" size={22} color="rgba(255,255,255,0.4)" style={styles.icon} />
                  <TextInput style={styles.input} placeholder="name@example.com" placeholderTextColor="rgba(255,255,255,0.3)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress"/>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.glassInput}>
                  <MaterialIcons name="phone" size={22} color="rgba(255,255,255,0.4)" style={styles.icon} />
                  <TextInput style={styles.input} placeholder="10-digit number" placeholderTextColor="rgba(255,255,255,0.3)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber"/>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.glassInput}>
                  <MaterialIcons name="lock-outline" size={22} color="rgba(255,255,255,0.4)" style={styles.icon} />
                  <TextInput style={styles.input} placeholder="Create a strong password" placeholderTextColor="rgba(255,255,255,0.3)" value={password} onChangeText={setPassword} secureTextEntry={!isPasswordVisible} autoCapitalize="none" autoComplete="new-password" textContentType="newPassword"/>
                  <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeButton} accessibilityRole="button" accessibilityLabel="Show or hide password">
                    <MaterialIcons name={isPasswordVisible ? "visibility" : "visibility-off"} size={22} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.glassInput}>
                  <MaterialIcons name="lock-outline" size={22} color="rgba(255,255,255,0.4)" style={styles.icon} />
                  <TextInput style={styles.input} placeholder="Repeat your password" placeholderTextColor="rgba(255,255,255,0.3)" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!isConfirmPasswordVisible} autoCapitalize="none" autoComplete="new-password" textContentType="newPassword"/>
                  <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.eyeButton} accessibilityRole="button" accessibilityLabel="Show or hide confirm password">
                    <MaterialIcons name={isConfirmPasswordVisible ? "visibility" : "visibility-off"} size={22} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp} disabled={isLoading || isOAuthLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#102217" size="small" />
                ) : (
                  <>
                    <Text style={styles.signUpButtonText}>Create Account</Text>
                    <MaterialIcons name="arrow-forward" size={22} color="#102217" />
                  </>
                )}
              </TouchableOpacity>

              {/* Social Signup Divider Grid Row */}
              <View style={{ marginVertical: 20, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 15 }}>Or sign up with</Text>
                
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
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
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
                        notify('Not Supported', alertMsg, 'info');
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
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.logInText}>Sign In</Text>
              </TouchableOpacity>
            </View>
            </ResponsiveContainer>

            </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}