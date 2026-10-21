import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert,
  Linking,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { styles, CARD_WIDTH, SPACING } from "../styles/ResultStyles";

const { width } = Dimensions.get('window');

export default function ResultScreen({ navigation, route }) {
  const [activeSlide, setActiveSlide] = useState(0);

  // 1. Extract the raw navigation parameters safely
  const rawParams = route.params || {};
  const incomingPlans = rawParams.plans || [];

  // 2. Clear out any format mismatches using a robust normalizer loop
  const cleanedPlans = incomingPlans.map((plan, index) => {
    // Look across all common backend keys to find your timeline array
    const rawStops = plan.stops || plan.timeline || plan.items || [];
    
    // Look across all common keys to find your cost number
    const cost = plan.totalEst ?? plan.total_cost ?? plan.cost_breakdown?.total ?? "0";

    return {
      id: plan.id || index + 1,
      title: plan.title || `Route Option ${index + 1}`,
      totalEst: cost,
      costDisplay: plan.costDisplay || (plan.unknownCostCount > 0 ? (Number(cost) > 0 ? `₹${cost}+` : "Not listed") : `₹${cost}`),
      unknownCostCount: Number(plan.unknownCostCount || plan.cost_breakdown?.unknown_count || 0),
      image: plan.image || rawStops[0]?.image || rawStops[0]?.image_url || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop',
      stops: rawStops.map((stop, i) => ({
        icon: stop.icon || (stop.category?.toLowerCase().includes('food') || stop.type?.toLowerCase().includes('food') ? 'restaurant' : 'park'),
        title: stop.title || stop.name || `Stop ${i + 1}`,
        type: stop.type || stop.category || "Activity",
        time: stop.time || "Flexible",
        price: stop.price !== undefined && stop.price !== null
          ? (typeof stop.price === 'number'
              ? (stop.price === 0 ? "Free" : `~₹${stop.price}`)
              : stop.price)
          : "Cost not listed",
        desc: stop.desc || stop.description || "No description details provided.",
        image: stop.image || stop.image_url || null,
        latitude: stop.latitude !== undefined && stop.latitude !== null ? Number(stop.latitude) : null,
        longitude: stop.longitude !== undefined && stop.longitude !== null ? Number(stop.longitude) : null,
        address: stop.address || null
      }))
    };
  });

  // Never replace a missing/empty itinerary with unrelated demo attractions.
  const plans = cleanedPlans.filter(plan => plan.stops.length > 0);

  const handleNavigate = async (plan) => {
    const stops = plan.stops;
    const hasValidCoordinates = stops.every((stop) => (
      Number.isFinite(stop.latitude) &&
      Number.isFinite(stop.longitude) &&
      stop.latitude >= -90 && stop.latitude <= 90 &&
      stop.longitude >= -180 && stop.longitude <= 180 &&
      !(stop.latitude === 0 && stop.longitude === 0)
    ));

    if (stops.length === 0 || !hasValidCoordinates) {
      const message = 'This itinerary is missing exact map coordinates. Please generate it again.';
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Route Unavailable', message);
      return;
    }

    let url;
    if (stops.length === 1) {
      const onlyStop = stops[0];
      const coordinates = encodeURIComponent(`${onlyStop.latitude},${onlyStop.longitude}`);
      url = `https://www.google.com/maps/search/?api=1&query=${coordinates}`;
    } else {
      // Google Maps supports up to 3 intermediate stops on mobile URLs and
      // up to 9 on other platforms. Keep the route within those documented limits.
      const maxWaypoints = Platform.OS === 'web' ? 9 : 3;
      const maxStopsInOneRoute = maxWaypoints + 2;
      const allWaypoints = stops.slice(1, -1);
      const routeStops = stops.slice(0, maxStopsInOneRoute);
      const waypoints = routeStops.slice(1, -1);
      const firstStop = routeStops[0];
      const lastStop = routeStops[routeStops.length - 1];
      const waypointParameter = waypoints.length
        ? `&waypoints=${encodeURIComponent(waypoints.map(stop => `${stop.latitude},${stop.longitude}`).join('|'))}`
        : '';

      const origin = encodeURIComponent(`${firstStop.latitude},${firstStop.longitude}`);
      const destination = encodeURIComponent(`${lastStop.latitude},${lastStop.longitude}`);
      url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointParameter}&travelmode=driving`;

      if (allWaypoints.length > maxWaypoints) {
        const message = `Google Maps can include only ${maxWaypoints} intermediate stops on this device. Open the first ${maxStopsInOneRoute} stops as one route?`;
        if (Platform.OS === 'web') {
          if (!window.confirm(message)) return;
        } else {
          Alert.alert('Route Stop Limit', message, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Route', onPress: () => Linking.openURL(url).catch(() => Alert.alert('Navigation Error', 'Unable to open Google Maps on this device.')) }
          ]);
          return;
        }
      }
    }

    try {
      await Linking.openURL(url);
    } catch (error) {
      const message = 'Unable to open Google Maps on this device.';
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Navigation Error', message);
    }
  };

  const handleScroll = (event) => {
    const slideSize = CARD_WIDTH + 20; 
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveSlide(Math.round(index));
  };

  if (plans.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
              {rawParams.emptyTitle || 'No Itinerary Available'}
            </Text>
            <Text style={{ color: '#b8c5bd', textAlign: 'center', marginTop: 12 }}>
              {rawParams.emptyMessage || 'No verified places were returned for these preferences. Go back and try another selection.'}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.backgroundLayer}>
        <LinearGradient colors={['#102217', '#050505']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.ambientGlow} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>YOUR TRIP</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Carousel Content */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SPACING - 10, paddingVertical: 20 }}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + 20}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {plans.map((plan) => (
            <View key={plan.id} style={[styles.cardContainer, { marginRight: 20 }]}>
              <View style={styles.card}>
                
                {/* Image Header */}
                <View style={styles.cardImageContainer}>
                  <Image source={{ uri: plan.image }} style={styles.cardImage} />
                  <LinearGradient colors={['transparent', '#15291f']} style={styles.imageGradient} />
                  <View style={styles.cardHeaderContent}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <View style={styles.priceTag}>
                      <Text style={styles.priceLabel}>Entry fees est.:</Text>
                      <Text style={styles.priceValue}>{plan.costDisplay}/person</Text>
                    </View>
                    <Text style={{ color: "#B6C7BB", fontSize: 10, marginTop: 4 }}>Per-person attraction entry fees only; transport, meals and optional activities are extra.</Text>
                  </View>
                </View>

                {/* Stops Timeline list loop */}
                <ScrollView style={styles.cardBody} showsVerticalScrollIndicator={false}>
                  {plan.stops.map((stop, i) => {
                    const isLast = i === plan.stops.length - 1;
                    return (
                      <View key={i} style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                          <View style={styles.iconCircle}>
                            <MaterialIcons name={stop.icon} size={20} color="#0df269" />
                          </View>
                          {!isLast && <View style={styles.timelineLine} />}
                        </View>

                        <View style={[styles.timelineRight, { paddingBottom: isLast ? 0 : 24 }]}>
                          <View style={styles.stopHeader}>
                            <Text style={styles.stopTitle}>{stop.title}</Text>
                            <View style={styles.stopPriceTag}>
                              <Text style={stop.price === "Free" ? [styles.stopPriceText, { color: '#0df269' }] : styles.stopPriceText}>
                                {stop.price}
                              </Text>
                            </View>
                          </View>
                          <Text style={stop.styles?.stopTime || styles.stopTime}>{stop.time} {'\u2022'} {stop.type}</Text>
                          
                          {/* Inner Row Container for Image and Description Alignment */}
                          <View style={{ flexDirection: 'row', marginTop: 6, alignItems: 'flex-start' }}>
                            {stop.image && (
                              <Image 
                                source={{ uri: stop.image }} 
                                style={{ 
                                  width: 65, 
                                  height: 65, 
                                  borderRadius: 8, 
                                  marginRight: 10,
                                  backgroundColor: 'rgba(255,255,255,0.05)'
                                }} 
                                resizeMode="cover"
                              />
                            )}
                            <Text style={[styles.stopDesc, { flex: 1 }]} numberOfLines={3}>
                              {stop.desc}
                            </Text>
                          </View>

                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Footer Action Navigation */}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.navigateButton}
                    onPress={() => handleNavigate(plan)}
                  >
                    <Text style={styles.navigateText}>Navigate This Route</Text>
                    <View style={styles.navIconCircle}>
                      <MaterialIcons name="navigation" size={20} color="#102217" />
                    </View>
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          ))}
        </ScrollView>

        {/* Pagination indicators */}
        <View style={styles.pagination}>
          {plans.map((_, index) => (
            <View key={index} style={[styles.dot, activeSlide === index && styles.activeDot]} />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}