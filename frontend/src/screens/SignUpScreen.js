import React, { useState } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';

import { signUpUser } from '../services/api';
import { styles } from "../styles/SignUpStyles";

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

              <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
                <Text style={styles.signUpButtonText}>Create Account</Text>
                <MaterialIcons name="arrow-forward" size={22} color="#102217" />
              </TouchableOpacity>
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