import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import { MaterialIcons } from '@expo/vector-icons';

import { styles } from "../styles/LoadingScreenStyles";

export default function LoadingScreen({ navigation }) {
  // Animation Value
  const bounceValue = new Animated.Value(0);

  useEffect(() => {
    // 1. Start the Bouncing Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, { toValue: -20, duration: 500, useNativeDriver: true }),
        Animated.timing(bounceValue, { toValue: 0, duration: 500, useNativeDriver: true })
      ])
    ).start();

    // 2. The Timer: Wait 2.5 seconds, then go to Results
    const timer = setTimeout(() => {
      navigation.replace('Result'); // 'replace' means they can't go back to loading
    }, 2500);

    return () => clearTimeout(timer); // Cleanup if user leaves early
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#102217', '#050505']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.content}>
        {/* Bouncing Pin */}
        <Animated.View style={{ transform: [{ translateY: bounceValue }] }}>
          <MaterialIcons name="location-on" size={80} color="#0df269" />
        </Animated.View>
        
        {/* Shadow/Coin Stack base */}
        <View style={styles.shadow} />

        <Text style={styles.loadingText}>Finding the best spots...</Text>
        <Text style={styles.subText}>Checking budget & vibes</Text>
        
        <ActivityIndicator size="large" color="#0df269" style={{ marginTop: 40 }} />
      </View>
    </View>
  );
}

