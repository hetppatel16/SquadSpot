import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  Linking,
  Platform,
  useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { styles } from "../styles/ResultStyles";
import { confirmAction, notify } from '../utils/feedback';
import { loadTrip } from '../utils/tripStore';
// Web: interactive Leaflet map (RouteMap.web.js). Mobile: renders nothing (RouteMap.js).
import RouteMap from '../components/RouteMap';

const CARD_GAP = 20;
const WIDE_LAYOUT_MIN_WIDTH = 900;

// Web: the whole page scrolls and every stop is visible in the card.
// Mobile: fixed-height cards you swipe between, each scrolling on its own.
const isWeb = Platform.OS === 'web';
const Page = isWeb ? ScrollView : View;
const StopList = isWeb ? View : ScrollView;

const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};

export default function ResultScreen({ navigation, route }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef(null);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width * 0.85, width >= WIDE_LAYOUT_MIN_WIDTH ? 640 : 460);
  const sidePadding = Math.max((width - cardWidth) / 2, 20);

  // 1. Use the trip passed by the loading screen; after a browser refresh
  //    (no navigation params) fall back to the trip saved in tripStore.
  const passedParams = route.params || {};
  const hasPassedTrip = Array.isArray(passedParams.plans) || passedParams.emptyTitle;
  const rawParams = hasPassedTrip ? passedParams : (loadTrip() || {});
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
      optionLabel: plan.optionLabel || null,
      startsFromUserLocation: Boolean(plan.startsFromUserLocation),
      exceedsDuration: Boolean(plan.exceedsDuration),
      totalDurationMinutes: Number(plan.totalDurationMinutes || 0),
      image: plan.image || rawStops.find(stop => stop.image || stop.image_url)?.image || rawStops.find(stop => stop.image_url)?.image_url || null,
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
  const activePlan = plans[Math.min(activeSlide, plans.length - 1)] || null;
  const requestedHours = Number(rawParams.requestedHours) || null;

  const durationWarning = (plan) => (
    plan.exceedsDuration && requestedHours
      ? `This plan takes about ${formatDuration(plan.totalDurationMinutes)}, longer than the ${requestedHours} h you chose. You can skip a stop or choose a longer duration.`
      : null
  );

  // Remind the user once when the trip opens if it runs long.
  const firstWarning = plans.map(durationWarning).find(Boolean);
  useEffect(() => {
    if (firstWarning) notify('This plan runs long', firstWarning, 'info');
  }, [firstWarning]);

  // A trip page opened directly (bookmark, refresh) has no screen to go back to.
  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Planner'));

  const openRoute = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      notify('Navigation Error', 'Unable to open Google Maps on this device.');
    }
  };

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
      notify('Route Unavailable', 'This itinerary is missing exact map coordinates. Please generate it again.');
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
        const confirmed = await confirmAction({
          title: 'Route Stop Limit',
          message: `Google Maps can include only ${maxWaypoints} intermediate stops on this device. Open the first ${maxStopsInOneRoute} stops as one route?`,
          confirmText: 'Open Route',
        });
        if (!confirmed) return;
      }
    }

    await openRoute(url);
  };

  const handleScroll = (event) => {
    const slideSize = cardWidth + CARD_GAP;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveSlide(Math.round(index));
  };

  // Arrow and dot buttons: needed on desktop, where sideways scrolling with a
  // mouse is awkward; on phones they work alongside swiping.
  const goToSlide = (index) => {
    const next = Math.max(0, Math.min(index, plans.length - 1));
    setActiveSlide(next);
    carouselRef.current?.scrollTo({ x: next * (cardWidth + CARD_GAP), animated: true });
  };

  const backButton = (
    <TouchableOpacity onPress={goBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back to planner">
      <MaterialIcons name="arrow-back" size={28} color="white" />
    </TouchableOpacity>
  );

  if (plans.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.header, isWeb && styles.headerCompact]}>{backButton}</View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {rawParams.emptyTitle || 'No Itinerary Available'}
            </Text>
            <Text style={styles.emptyMessage}>
              {rawParams.emptyMessage || 'No trip has been planned yet. Go back and choose your city and interests.'}
            </Text>
            <TouchableOpacity style={styles.emptyAction} onPress={() => navigation.navigate('Planner')} accessibilityRole="button">
              <Text style={styles.emptyActionText}>Plan a trip</Text>
            </TouchableOpacity>
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
        <Page style={styles.page} {...(isWeb ? { contentContainerStyle: styles.pageContent } : {})}>
        {/* Header */}
        <View style={[styles.header, isWeb && styles.headerCompact]}>
          {backButton}
          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>YOUR TRIP</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Carousel Content */}
        <ScrollView
          ref={carouselRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: sidePadding - CARD_GAP / 2, paddingVertical: 20 }}
          decelerationRate="fast"
          snapToInterval={cardWidth + CARD_GAP}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {plans.map((plan) => {
            const warning = durationWarning(plan);
            return (
            <View key={plan.id} style={[styles.cardContainer, isWeb && styles.cardContainerWeb, { width: cardWidth, marginRight: CARD_GAP }]}>
              <View style={[styles.card, !isWeb && styles.cardMobile]}>

                {/* Image Header */}
                <View style={styles.cardImageContainer}>
                  {plan.image ? (
                    <Image source={{ uri: plan.image }} style={styles.cardImage} />
                  ) : (
                    <LinearGradient colors={['#1c3829', '#0b1a12']} style={styles.cardImage}>
                      <MaterialIcons name="location-city" size={72} color="rgba(13,242,105,0.18)" style={styles.placeholderIcon} />
                    </LinearGradient>
                  )}
                  <LinearGradient colors={['transparent', '#15291f']} style={styles.imageGradient} />
                  <View style={styles.cardHeaderContent}>
                    {plan.optionLabel && <Text style={styles.optionLabel}>{plan.optionLabel}</Text>}
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <View style={styles.priceTag}>
                      <Text style={styles.priceLabel}>Expected Expense:</Text>
                      <Text style={styles.priceValue}>{plan.costDisplay}/person</Text>
                    </View>
                    <Text style={{ color: "#B6C7BB", fontSize: 10, marginTop: 4 }}>Per person, for the places on this plan; "est." prices are estimates. Transport and extras are not included.</Text>
                    {plan.startsFromUserLocation && (
                      <Text style={styles.startNote}>Starts from your current location</Text>
                    )}
                  </View>
                </View>

                {warning && (
                  <View style={styles.durationBanner} accessibilityRole="alert">
                    <MaterialIcons name="schedule" size={18} color="#fbbf24" style={{ marginRight: 8 }} />
                    <Text style={styles.durationBannerText}>{warning}</Text>
                  </View>
                )}

                {/* Stops Timeline list loop */}
                <StopList style={[styles.cardBody, isWeb ? styles.cardBodyWeb : styles.cardBodyMobile]} {...(isWeb ? {} : { showsVerticalScrollIndicator: false })}>
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
                          <Text style={stop.styles?.stopTime || styles.stopTime}>{stop.time} {'•'} {stop.type}</Text>

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
                </StopList>

                {/* Footer Action Navigation */}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.navigateButton}
                    onPress={() => handleNavigate(plan)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.navigateText}>Navigate This Route</Text>
                    <View style={styles.navIconCircle}>
                      <MaterialIcons name="navigation" size={20} color="#102217" />
                    </View>
                  </TouchableOpacity>
                </View>

              </View>
            </View>
            );
          })}
        </ScrollView>

        {/* Pagination indicators */}
        <View style={styles.pagination}>
          {plans.length > 1 && (
            <TouchableOpacity
              onPress={() => goToSlide(activeSlide - 1)}
              disabled={activeSlide === 0}
              style={[styles.pageArrow, activeSlide === 0 && styles.pageArrowDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Previous option"
            >
              <MaterialIcons name="chevron-left" size={24} color="#0df269" />
            </TouchableOpacity>
          )}
          {plans.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => goToSlide(index)}
              style={styles.dotTarget}
              accessibilityRole="button"
              accessibilityLabel={`Show option ${index + 1}`}
              accessibilityState={{ selected: activeSlide === index }}
            >
              <View style={[styles.dot, activeSlide === index && styles.activeDot]} />
            </TouchableOpacity>
          ))}
          {plans.length > 1 && (
            <TouchableOpacity
              onPress={() => goToSlide(activeSlide + 1)}
              disabled={activeSlide === plans.length - 1}
              style={[styles.pageArrow, activeSlide === plans.length - 1 && styles.pageArrowDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Next option"
            >
              <MaterialIcons name="chevron-right" size={24} color="#0df269" />
            </TouchableOpacity>
          )}
        </View>

        {/* Map of the trip shown in the carousel; keyed so it re-fits when the trip changes. */}
        {activePlan && (
          <View style={[styles.mapSection, { width: cardWidth }]}>
            <RouteMap key={activePlan.id} stops={activePlan.stops} />
          </View>
        )}
        </Page>
      </SafeAreaView>
    </View>
  );
}
