import React, { useState } from 'react';
import { styles } from '../styles/ForgotPasswordStyles';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  SafeAreaView,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { requestPasswordReset } from '../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    const emailClean = email.trim();
    if (emailClean === '') {
      if (Platform.OS === 'web') {
        window.alert('Please enter your email address.');
      } else {
        Alert.alert('Missing Email', 'Please enter your email address.');
      }
      return;
    }
    try {
      setIsLoading(true);
      await requestPasswordReset(emailClean);
      if (Platform.OS === 'web') {
        window.alert('OTP code generated successfully. Please check your backend console logs!');
      } else {
        Alert.alert('OTP Generated', 'OTP code generated successfully. Please check your backend console logs!');
      }
      navigation.navigate('OtpScreen', { email: emailClean });
    } catch (error) {
      console.error('Reset Password Error:', error);
      const errMsg = error.message || 'Cannot reach backend server. Make sure it is running.';
      if (Platform.OS === 'web') {
        window.alert(errMsg);
      } else {
        Alert.alert('Error', errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* --- Abstract Background Elements --- */}
      <View style={[styles.glowOrb, { top: '-10%', right: '-10%', opacity: 0.1 }]} />
      <View style={[styles.glowOrb, { bottom: '-5%', left: '-5%', opacity: 0.05, width: 320, height: 320 }]} />
      <View style={styles.geoShape1} />
      <View style={styles.geoShape2} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <Pressable onPress={Keyboard.dismiss} style={styles.keyboardView}>
            <View style={styles.innerContainer}>

              {/* Top Navigation */}
              <View style={styles.navContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                  <BlurView intensity={20} tint="dark" style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#f1f5f9" />
                  </BlurView>
                </TouchableOpacity>
              </View>

              {/* Content Area */}
              <View style={styles.contentArea}>

                <View style={styles.header}>
                  <Text style={styles.title}>Forgot Password?</Text>
                  <Text style={styles.subtitle}>
                    Enter your email address to receive a password reset link.
                  </Text>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="name@example.com"
                        placeholderTextColor="#475569"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
                      />
                      <MaterialIcons
                        name="mail"
                        size={24}
                        color="#475569"
                        style={styles.inputIcon}
                      />
                    </View>
                  </View>

                  {/* Gradient Submit Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.submitButtonWrapper, isLoading && { opacity: 0.7 }]}
                    onPress={handleSendOtp}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#0df269', '#0be361', '#09d45a']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitButton}
                    >
                      <Text style={styles.submitButtonText}>{isLoading ? 'Sending...' : 'Send OTP'}</Text>
                      <MaterialIcons name="send" size={20} color="#102217" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.footerLink}
                  onPress={() => navigation.navigate('Login')}
                >
                  <MaterialIcons name="login" size={18} color="#94a3b8" style={styles.footerIcon} />
                  <Text style={styles.footerText}>Back to Log In</Text>
                </TouchableOpacity>
              </View>

            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
