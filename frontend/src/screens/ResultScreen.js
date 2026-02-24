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

  // Use real data from API (passed via navigation params) or fallback to demo data
  const plans = route.params?.plans || [
    {
      id: 1,
      title: 'The Chill Evening',
      totalEst: '450',
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop',
      stops: [
        { icon: 'park', title: 'Sayaji Baug', type: 'Evening Walk', time: '5:00 PM', price: 'Free', desc: 'Relaxing stroll through the lush gardens and visit the museum.' },
        { icon: 'restaurant', title: 'Raju Omlet', type: 'Dinner', time: '6:30 PM', price: '~₹150', desc: 'Famous local spot for egg varieties. Try the crushed egg fry.' },
        { icon: 'movie', title: 'Inox Movie', type: 'Late Show', time: '8:00 PM', price: '~₹300', desc: 'Catch the latest blockbuster at the premium screen.' }
      ]
    },
  ];

  // 2. Add this function to calculate the index
  const handleScroll = (event) => {
    const slideSize = CARD_WIDTH + 20; // Width of card + margin
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveSlide(roundIndex);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Layer */}
      <View style={styles.backgroundLayer}>
        <LinearGradient
          colors={['#102217', '#050505']}
          style={StyleSheet.absoluteFillObject}
        />
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

        {/* Carousel Area */}
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

                {/* Card Image Header */}
                <View style={styles.cardImageContainer}>
                  <Image source={{ uri: plan.image }} style={styles.cardImage} />
                  <LinearGradient
                    colors={['transparent', '#15291f']}
                    style={styles.imageGradient}
                  />

                  <View style={styles.cardHeaderContent}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <View style={styles.priceTag}>
                      <Text style={styles.priceLabel}>Total Est:</Text>
                      <Text style={styles.priceValue}>₹{plan.totalEst}/person</Text>
                    </View>
                  </View>
                </View>

                {/* Timeline Content */}
                <ScrollView style={styles.cardBody} showsVerticalScrollIndicator={false}>
                  {plan.stops.map((stop, i) => {
                    const isLast = i === plan.stops.length - 1;
                    return (
                      <View key={i} style={styles.timelineItem}>
                        {/* Left Column */}
                        <View style={styles.timelineLeft}>
                          <View style={styles.iconCircle}>
                            <MaterialIcons name={stop.icon} size={20} color="#0df269" />
                          </View>
                          {!isLast && <View style={styles.timelineLine} />}
                        </View>

                        {/* Right Column */}
                        <View style={[styles.timelineRight, { paddingBottom: isLast ? 0 : 24 }]}>
                          <View style={styles.stopHeader}>
                            <Text style={styles.stopTitle}>{stop.title}</Text>
                            <View style={styles.stopPriceTag}>
                              <Text style={styles.stopPriceText}>{stop.price}</Text>
                            </View>
                          </View>
                          <Text style={styles.stopTime}>{stop.time} • {stop.type}</Text>
                          <Text style={styles.stopDesc} numberOfLines={2}>
                            {stop.desc}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Footer Button */}
                <View style={styles.cardFooter}>
                  <LinearGradient
                    colors={['rgba(21, 41, 31, 0)', '#15291f']}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                  />
                  <TouchableOpacity
                    style={styles.navigateButton}
                    onPress={() => {
                      const firstStop = plan.stops[0].title;
                      const mapUrl = `https://maps.google.com/?q=${firstStop}`;
                      Linking.openURL(mapUrl);
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

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {plans.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeSlide === index && styles.activeDot
              ]}
            />
          ))}
        </View>

        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab}>
          <MaterialIcons name="autorenew" size={24} color="white" />
        </TouchableOpacity>

      </SafeAreaView>
    </View>
  );
}
