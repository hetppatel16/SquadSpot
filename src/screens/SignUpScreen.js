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
  ScrollView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import { MaterialIcons } from '@expo/vector-icons';

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  // Password Validation Logic
  const handleSignUp = () => {
    // 1. Check if passwords match
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    // 2. Check Constraints
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    if (!isLongEnough || !hasLetter || !hasNumber || !hasSpecial) {
      Alert.alert(
        "Weak Password", 
        "Password must be at least 8 characters long and contain at least one letter, one number, and one special character."
      );
      return;
    }

    // If everything passes, we pretend to create the account and go back
    Alert.alert("Success!", "Your account has been created.", [
      { text: "OK", onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Layer */}
      <LinearGradient
        colors={['#102217', '#050505']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.glowShape, { top: -100, left: -50, backgroundColor: '#1e3a8a' }]} />
      <View style={[styles.glowShape, { bottom: -100, right: -50, backgroundColor: '#581c87' }]} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            
            {/* Header with Back Button */}
            <View style={styles.headerContainer}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={28} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTextContainer}>
                <Text style={styles.subtitle}>Create your account</Text>
              </View>
            </View>

            {/* Form Section */}
            <View style={styles.form}>

              {/* Full Name */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.glassInput}>
                  <MaterialIcons name="person-outline" size={22} color="rgba(255,255,255,0.4)" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.glassInput}>
                  <MaterialIcons name="phone" size={22} color="rgba(255,255,255,0.4)" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="+91"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Email Address */}
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

              {/* Password */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.glassInput}>
                  <MaterialIcons name="lock-outline" size={22} color="rgba(255,255,255,0.4)" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="8+ chars, 1 num, 1 special"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible} 
                  />
                  <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeButton}>
                    <MaterialIcons name={isPasswordVisible ? "visibility" : "visibility-off"} size={22} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.glassInput}>
                  <MaterialIcons name="lock-outline" size={22} color="rgba(255,255,255,0.4)" style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="Repeat password"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!isConfirmVisible} 
                  />
                  <TouchableOpacity onPress={() => setIsConfirmVisible(!isConfirmVisible)} style={styles.eyeButton}>
                    <MaterialIcons name={isConfirmVisible ? "visibility" : "visibility-off"} size={22} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Main Action Button */}
              <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
                <Text style={styles.signUpButtonText}>Create Account</Text>
                <MaterialIcons name="check-circle-outline" size={22} color="#102217" />
              </TouchableOpacity>

            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.logInText}>Log In</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

// Reusing the exact styles from LoginScreen to maintain the theme
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#102217' },
  glowShape: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.4 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, position: 'relative' },
  backButton: { position: 'absolute', left: 0, zIndex: 10, padding: 8 },
  headerTextContainer: { flex: 1, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#ffffff', marginBottom: 4, letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: '400' },
  form: { marginBottom: 20 },
  inputWrapper: { marginBottom: 16 },
  label: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 12 },
  glassInput: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)',
    height: 60, borderRadius: 30, paddingHorizontal: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  icon: { marginRight: 12 },
  input: { flex: 1, color: '#ffffff', fontSize: 16, height: '100%' },
  eyeButton: { padding: 8 },
  signUpButton: {
    backgroundColor: '#0df269', height: 60, borderRadius: 30, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', shadowColor: '#0df269',
    shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 0 }, elevation: 8, marginTop: 10
  },
  signUpButtonText: { color: '#102217', fontSize: 18, fontWeight: 'bold', marginRight: 8, letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, paddingBottom: 20 },
  footerText: { color: 'rgba(255,255,255,0.6)', fontSize: 15 },
  logInText: { color: '#0df269', fontSize: 15, fontWeight: 'bold' },
});