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
  Linking
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
    const cost = plan.totalEst || plan.total_cost || plan.cost_breakdown?.total || "0";

    return {
      id: plan.id || index + 1,
      title: plan.title || `Route Option ${index + 1}`,
      totalEst: cost,
      image: plan.image || rawStops[0]?.image || rawStops[0]?.image_url || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop',
      stops: rawStops.map((stop, i) => ({
        icon: stop.icon || (stop.category?.toLowerCase().includes('food') || stop.type?.toLowerCase().includes('food') ? 'restaurant' : 'park'),
        title: stop.title || stop.name || `Stop ${i + 1}`,
        type: stop.type || stop.category || "Activity",
        time: stop.time || "Flexible",
        price: stop.price !== undefined ? (typeof stop.price === 'number' ? `~\u20b9${stop.price}` : stop.price) : "Free",
        desc: stop.desc || stop.description || "No description details provided.",
        image: stop.image || stop.image_url || null // Retain image reference properties through cleanup mapper layers
      }))
    };
  });

  // 3. Fallback to sample demo cards if the dataset is completely missing items
  const fallbackPlan = [
    {
      id: 1,
      title: 'The Chill Evening (Backup)',
      totalEst: '450',
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop',
      stops: [
        { icon: 'restaurant', title: 'Raju Omlet', type: 'Dinner', time: '6:30 PM', price: '~\u20b9150', desc: 'Famous local spot for egg varieties. Try the crushed egg fry.', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600' },
        { icon: 'park', title: 'Sayaji Baug', type: 'Evening Walk', time: '8:00 PM', price: 'Free', desc: 'Relaxing stroll through the lush gardens and visit the museum.', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=600' }
      ]
    }
  ];

  // Use cleaned database plans if they have content, otherwise load our fallback display layout!
  const hasValidStops = cleanedPlans.length > 0 && cleanedPlans[0].stops.length > 0;
  const plans = hasValidStops ? cleanedPlans : fallbackPlan;

  const handleScroll = (event) => {
    const slideSize = CARD_WIDTH + 20; 
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveSlide(Math.round(index));
  };

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
                      <Text style={styles.priceLabel}>Total Est:</Text>
                      <Text style={styles.priceValue}>{'\u20b9'}{plan.totalEst}/person</Text>
                    </View>
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
                    onPress={() => {
                      if (plan.stops.length > 0) {
                        const firstStop = plan.stops[0].title;
                        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(firstStop)}`);
                      }
                    }}
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