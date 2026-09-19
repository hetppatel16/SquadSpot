import React, { useState, useRef } from 'react';
import { styles } from '../styles/OtpStyles';
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
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { verifyOtpAndResetPassword } from '../services/api';

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

export default function OtpScreen({ navigation, route }) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 4) {
      if (Platform.OS === 'web') {
        window.alert('Please enter the 4-digit OTP.');
      } else {
        Alert.alert('Incomplete OTP', 'Please enter the 4-digit OTP.');
      }
      return;
    }

    if (!newPassword.trim()) {
      const emptyMsg = 'Please enter a new password.';
      if (Platform.OS === 'web') window.alert(emptyMsg);
      else Alert.alert('Missing Details', emptyMsg);
      return;
    }

    const passwordValidation = validatePasswordInline(newPassword);
    if (!passwordValidation.isValid) {
      const errorMsg = "Password must include:\n" + passwordValidation.errors.map(e => `• ${e}`).join('\n');
      if (Platform.OS === 'web') window.alert(errorMsg);
      else Alert.alert('Weak Password', errorMsg);
      return;
    }

    const email = route.params?.email || '';
    try {
      setIsLoading(true);
      await verifyOtpAndResetPassword(email, otpCode, newPassword);
      if (Platform.OS === 'web') {
        window.alert('Password reset and updated successfully! You can now log in.');
      } else {
        Alert.alert('Verification Successful', 'Password reset and updated successfully! You can now log in.');
      }
      navigation.navigate('Login');
    } catch (error) {
      console.error('OTP Verification Error:', error);
      const errMsg = error.message || 'Cannot reach backend server. Make sure it is running.';
      if (Platform.OS === 'web') {
        window.alert(errMsg);
      } else {
        Alert.alert('Verification Failed', errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance to the next input if a number is typed
    if (text.length === 1 && index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
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
                  <Text style={styles.title}>Verify OTP</Text>
                  <Text style={styles.subtitle}>
                    We've sent a 4-digit code to your email.
                  </Text>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>

                  {/* 4-Box OTP Input Area */}
                  <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => (inputRefs.current[index] = ref)}
                        style={[
                          styles.otpBox,
                          digit !== '' && styles.otpBoxActive
                        ]}
                        value={digit}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                      />
                    ))}
                  </View>

                  {/* New Password input */}
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.glassInput}>
                      <MaterialIcons name="lock-outline" size={22} color="rgba(255,255,255,0.4)" style={styles.icon} />
                      <TextInput 
                        style={styles.input} 
                        placeholder="Enter your new password" 
                        placeholderTextColor="rgba(255,255,255,0.3)" 
                        value={newPassword} 
                        onChangeText={setNewPassword} 
                        secureTextEntry={!isPasswordVisible} 
                        autoCapitalize="none"
                        autoComplete="new-password"
                        textContentType="newPassword"
                      />
                      <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeButton}>
                        <MaterialIcons name={isPasswordVisible ? "visibility" : "visibility-off"} size={22} color="rgba(255,255,255,0.4)" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Gradient Submit Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.submitButtonWrapper, isLoading && { opacity: 0.7 }]}
                    onPress={handleVerifyOtp}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#0df269', '#0be361', '#09d45a']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitButton}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#102217" size="small" />
                      ) : (
                        <>
                          <Text style={styles.submitButtonText}>Verify</Text>
                          <MaterialIcons name="send" size={20} color="#102217" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Resend Code Link */}
                  <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive the code? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                      <Text style={styles.resendLink}>Resend Code</Text>
                    </TouchableOpacity>
                  </View>

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
