import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { styles } from '../styles/LoadingScreenStyles';
import { fetchItinerary, transformToPlan } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoadingScreen({ navigation, route }) {
  const plannerData = route.params || {};
  const { getAccessToken } = useAuth();
  const bounceValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, { toValue: -20, duration: 500, useNativeDriver: true }),
        Animated.timing(bounceValue, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    );
    loadingAnimation.start();

    let cancelled = false;

    const callAPI = async () => {
      try {
        const accessToken = await getAccessToken();
        const apiResponse = await fetchItinerary(plannerData, accessToken);
        if (cancelled) return;

        const plans = transformToPlan(apiResponse);
        if (plans.length === 0) {
          const message = apiResponse?.message ||
            'No verified places match your selected city and preferences. Try changing your preferences.';

          // Navigate to the empty-result screen instead of using Alert.alert.
          // React Native Web does not reliably display native Alert dialogs,
          // which can leave the user stuck on this loading screen.
          navigation.replace('Result', {
            plans: [],
            emptyTitle: 'No Matching Places',
            emptyMessage: message,
            people: plannerData.people || 1,
          });
          return;
        }

        navigation.replace('Result', { plans, people: plannerData.people || 1 });
      } catch (error) {
        if (cancelled) return;

        // Show request errors in the app UI as well, so web users are never
        // left looking at an infinite spinner when a request fails.
        navigation.replace('Result', {
          plans: [],
          emptyTitle: 'Could Not Generate Itinerary',
          emptyMessage: error?.message || 'Could not reach the server. Please check that the backend is running and try again.',
          people: plannerData.people || 1,
        });
      }
    };

    callAPI();

    return () => {
      cancelled = true;
      loadingAnimation.stop();
    };
  }, [plannerData, navigation, bounceValue, getAccessToken]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#102217', '#050505']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.content}>
        <Animated.View style={{ transform: [{ translateY: bounceValue }] }}>
          <MaterialIcons name="location-on" size={80} color="#0df269" />
        </Animated.View>
        <View style={styles.shadow} />
        <Text style={styles.loadingText}>Finding the best spots...</Text>
        <Text style={styles.subText}>Checking budget & vibes</Text>
        <ActivityIndicator size="large" color="#0df269" style={{ marginTop: 40 }} />
      </View>
    </View>
  );
}
