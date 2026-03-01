import React, { useState, useRef } from 'react';
import { styles } from '../styles/OtpStyles';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
  SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function OtpScreen({ navigation }) {
  // State to hold the 4 digits
  const [otp, setOtp] = useState(['', '', '', '']);
  // Refs to automatically move focus between the 4 boxes
  const inputRefs = useRef([]);

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
    // Auto-go back to previous input if backspace is pressed on an empty box
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
                          digit !== '' && styles.otpBoxActive // Highlights green when filled
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

                  {/* Gradient Submit Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.submitButtonWrapper}
                    // In the future, this will trigger the API call to Dhairya's backend
                    onPress={() => console.log(`OTP Entered: ${otp.join('')}`)}
                  >
                    <LinearGradient
                      colors={['#0df269', '#0be361', '#09d45a']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitButton}
                    >
                      <Text style={styles.submitButtonText}>Verify</Text>
                      <MaterialIcons name="send" size={20} color="#102217" />
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Resend Code Link */}
                  <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive the code? </Text>
                    <TouchableOpacity>
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

