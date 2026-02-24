import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#102217' },
  content: { alignItems: 'center' },
  shadow: {
    width: 50, height: 10, borderRadius: 50, backgroundColor: 'rgba(0,0,0,0.5)', marginTop: 10
  },
  loadingText: {
    color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 40
  },
  subText: {
    color: 'rgba(255,255,255,0.5)', fontSize: 16, marginTop: 8
  }
});