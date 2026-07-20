import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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