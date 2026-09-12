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
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';

import { signUpUser, oauthLogin } from '../services/api';
import { styles } from "../styles/SignUpStyles";
import { GOOGLE_AUTH_CONFIG } from '../constants/authConfig';

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

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_AUTH_CONFIG.androidClientId,
    iosClientId: GOOGLE_AUTH_CONFIG.iosClientId,
    webClientId: GOOGLE_AUTH_CONFIG.webClientId,
    scopes: ['openid', 'profile', 'email'],
    extraParams: {
      prompt: 'select_account',
    },
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const authObj = response.authentication || {};
      const paramsObj = response.params || {};

      const idToken = authObj.idToken || authObj.id_token || paramsObj.id_token || paramsObj.idToken || null;
      const accessToken = authObj.accessToken || authObj.access_token || paramsObj.access_token || paramsObj.accessToken || null;

      handleBackendOAuth('google', idToken, accessToken);
    }
  }, [response]);

  const handleBackendOAuth = async (provider, idToken, accessToken) => {
    setIsOAuthLoading(true);
    try {
      const data = await oauthLogin(provider, idToken, accessToken);
      navigation.navigate('Planner', { user: data.user });
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
    // If the webClientId is still the default placeholder, automatically
    // authenticate in dev mode using the typed email or developer default
    if (GOOGLE_AUTH_CONFIG.webClientId.includes('YOUR_WEB_CLIENT_ID')) {
      const targetEmail = email.trim() && validateEmailInline(email.trim()) 
        ? email.trim() 
        : GOOGLE_AUTH_CONFIG.developerEmail;
      handleBackendOAuth('google', 'mock_google_token', targetEmail);
    } else {
      promptAsync();
    }
  };

  const handleSignUp = async () => {
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedFullName = fullName.trim();

    // 1. Check for blank fields
    if (!trimmedFullName || !trimmedEmail || !trimmedPhone || !password.trim() || !confirmPassword.trim()) {
      if (Platform.OS === 'web') window.alert('All fields are mandatory.');
      else Alert.alert('Validation Error', 'All fields are mandatory.');
      return;
    }

    // 2. Validate structural layout email
    if (!validateEmailInline(trimmedEmail)) {
      if (Platform.OS === 'web') window.alert('Please enter a valid structural email address.');
      else Alert.alert('Validation Error', 'Please enter a valid structural email address.');
      return;
    }

    // 3. Verify phone number length
    if (trimmedPhone.length !== 10) {
      if (Platform.OS === 'web') window.alert('Please enter a valid 10-digit phone number.');
      else Alert.alert('Validation Error', 'Please enter a valid 10-digit phone number.');
      return;
    }

    // 4. Confirm match strings
    if (password !== confirmPassword) {
      if (Platform.OS === 'web') window.alert('Passwords do not match!');
      else Alert.alert('Validation Error', 'Passwords do not match!');
      return;
    }

    // 5. Run Strict Security Rules Engine
    const passwordValidation = validatePasswordInline(password);
    if (!passwordValidation.isValid) {
      const errorMsg = "Password must include:\n" + passwordValidation.errors.map(e => `• ${e}`).join('\n');
      if (Platform.OS === 'web') window.alert(errorMsg);
      else Alert.alert('Weak Password', errorMsg);
      return;
    }

    try {
      setIsLoading(true);
      await signUpUser({
        name: trimmedFullName,
        email: trimmedEmail,
        password: password,
        phone: trimmedPhone
      });
      
      if (Platform.OS === 'web') window.alert('Account created successfully! Please log in.');
      else Alert.alert('Success', 'Account created successfully! Please log in.');
      
      navigation.navigate('Login');
    } catch (error) {
      if (Platform.OS === 'web') window.alert(error.message || 'Registration failed.');
      else Alert.alert('Registration Failed', error.message || 'Registration failed.');
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
                  <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeButton}>
                    <MaterialIcons name={isPasswordVisible ? "visibility" : "visibility-off"} size={22} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.glassInput}>
                  <MaterialIcons name="lock-outline" size={22} color="rgba(255,255,255,0.4)" style={styles.icon} />
                  <TextInput style={styles.input} placeholder="Repeat your password" placeholderTextColor="rgba(255,255,255,0.3)" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!isConfirmPasswordVisible} autoCapitalize="none" autoComplete="new-password" textContentType="newPassword"/>
                  <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.eyeButton}>
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
                    disabled={isOAuthLoading || isLoading}
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
                      opacity: (isOAuthLoading || isLoading) ? 0.7 : 1
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
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.logInText}>Sign In</Text>
              </TouchableOpacity>
            </View>

            </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}