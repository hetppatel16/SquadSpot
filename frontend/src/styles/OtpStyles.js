import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102217',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },

  // Abstract Elements 
  glowOrb: {
    position: 'absolute',
    width: 384,
    height: 384,
    backgroundColor: '#0df269',
    borderRadius: 9999,
  },
  geoShape1: {
    position: 'absolute',
    top: '25%',
    left: 40,
    width: 128,
    height: 128,
    borderWidth: 1,
    borderColor: 'rgba(13, 242, 105, 0.2)',
    borderRadius: 24,
    transform: [{ rotate: '45deg' }],
  },
  geoShape2: {
    position: 'absolute',
    bottom: '25%',
    right: 40,
    width: 192,
    height: 192,
    borderWidth: 1,
    borderColor: 'rgba(13, 242, 105, 0.1)',
    borderRadius: 9999,
  },

  // Navigation
  navContainer: {
    alignItems: 'flex-start',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 41, 59, 0.2)',
  },

  // Content
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 48,
    marginBottom: 'auto',
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f1f5f9',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#94a3b8',
    lineHeight: 28,
    maxWidth: 280,
  },

  // Form & OTP
  formContainer: {
    gap: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    color: '#0df269',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  otpBoxActive: {
    borderColor: '#0df269',
    boxShadow: '0px 0px 8px rgba(13, 242, 105, 0.2)',
  },

  // Button
  submitButtonWrapper: {
    boxShadow: '0px 8px 16px rgba(13, 242, 105, 0.2)',
    elevation: 8,
  },
  submitButton: {
    width: '100%',
    height: 64,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#102217',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Resend Text
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  resendText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  resendLink: {
    color: '#0df269',
    fontSize: 14,
    fontWeight: '600',
  },

  // Footer
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerIcon: {
    marginRight: 4,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '500',
  },
  inputWrapper: {
    marginBottom: 16,
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
});