import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { styles } from '../styles/LoadingScreenStyles';
import { fetchItinerary, transformToPlan } from '../services/api';

export default function LoadingScreen({ navigation, route }) {
  const plannerData = route.params || {};
  const bounceValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, { toValue: -20, duration: 500, useNativeDriver: true }),
        Animated.timing(bounceValue, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    let cancelled = false;

    const callAPI = async () => {
      try {
        const apiResponse = await fetchItinerary(plannerData);
        if (cancelled) return;

        const plans = transformToPlan(apiResponse);
        if (plans.length === 0) {
          Alert.alert('No Results', 'No places found for your criteria. Try a different city or adjust your preferences.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
          return;
        }

        navigation.replace('Result', { plans, people: plannerData.people || 1 });
      } catch (error) {
        if (cancelled) return;
        Alert.alert('Connection Error', 'Could not reach the server. Make sure the backend is running.\n\n' + (error?.message || 'Unknown error'), [{ text: 'Go Back', onPress: () => navigation.goBack() }]);
      }
    };

    callAPI();

    return () => { cancelled = true; };
  }, [plannerData, navigation, bounceValue]);

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
