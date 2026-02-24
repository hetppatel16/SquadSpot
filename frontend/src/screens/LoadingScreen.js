import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { styles } from "../styles/LoadingScreenStyles";
import { fetchItinerary, transformToPlan } from '../services/api';

export default function LoadingScreen({ navigation, route }) {
  // Get planner data passed from PlannerScreen
  const plannerData = route.params || {};

  // Animation Value
  const bounceValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Start the Bouncing Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, { toValue: -20, duration: 500, useNativeDriver: true }),
        Animated.timing(bounceValue, { toValue: 0, duration: 500, useNativeDriver: true })
      ])
    ).start();

    // 2. Call the API
    let cancelled = false;

    const callAPI = async () => {
      try {
        const apiResponse = await fetchItinerary(plannerData);
        if (cancelled) return;

        const plans = transformToPlan(apiResponse, plannerData.people || 1);

        if (plans.length === 0) {
          Alert.alert(
            'No Results',
            'No places found for your criteria. Try a different city or adjust your preferences.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }

        navigation.replace('Result', { plans, people: plannerData.people || 1 });
      } catch (error) {
        if (cancelled) return;
        console.error('API Error:', error);
        Alert.alert(
          'Connection Error',
          'Could not reach the server. Make sure the backend is running.\n\n' + error.message,
          [{ text: 'Go Back', onPress: () => navigation.goBack() }]
        );
      }
    };

    callAPI();

    return () => { cancelled = true; };
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
