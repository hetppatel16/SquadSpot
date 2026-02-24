import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102217', 
  },
  glowShape: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.4,
  },
  // ---> NEW LOGIC HERE <---
  scrollContent: {
    flexGrow: 1, // This is the magic property. It tells the scrollview to fill the screen, but stretch if needed.
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40, // Adds breathing room at the top/bottom when scrolling
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800', 
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
  },
  form: {
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 20,
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#0df269', 
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0df269',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  loginButtonText: {
    color: '#102217',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  orText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: 'bold',
    marginHorizontal: 16,
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 40,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
  },
  signUpText: {
    color: '#0df269',
    fontSize: 15,
    fontWeight: 'bold',
  },
});