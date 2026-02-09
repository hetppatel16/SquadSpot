import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ResultScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#102217', '#050505']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.content}>
        <Text style={styles.title}>Results</Text>
        <Text style={styles.placeholder}>Your itinerary will appear here</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102217',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
});
