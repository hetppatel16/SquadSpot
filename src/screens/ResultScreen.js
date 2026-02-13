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
  SafeAreaView ,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85; 
const SPACING = (width - CARD_WIDTH) / 2; 

export default function ResultScreen({ navigation }) {

  const [activeSlide, setActiveSlide] = useState(0);
  
  const plans = [
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
    { 
      id: 2, 
      title: 'Foodie Run', 
      totalEst: '600', 
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop',
      stops: [
        { icon: 'fastfood', title: 'Ratribazar', type: 'Street Food', time: '6:00 PM', price: '~₹200', desc: 'Explore the night food market varieties.' },
        { icon: 'icecream', title: 'Dairy Den', type: 'Dessert', time: '8:00 PM', price: '~₹100', desc: 'Famous soft serve ice cream to end the night.' } 
        // ^ FIXED: Changed 'ice-cream' to 'icecream'
      ]
    },
    { 
      id: 3, 
      title: 'Nature Escape', 
      totalEst: '150', 
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&auto=format&fit=crop',
      stops: [
        { icon: 'landscape', title: 'Kamati Baug', type: 'Walk', time: '5:00 PM', price: 'Free', desc: 'Fresh air and greenery.' }
      ]
    }
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
          // pagingEnabled 
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
                activeSlide === index && styles.activeDot // Apply active style if indexes match
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#102217' },
  backgroundLayer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  ambientGlow: {
    position: 'absolute', top: '40%', left: '50%', width: 300, height: 400,
    backgroundColor: 'rgba(13, 242, 105, 0.1)', borderRadius: 150,
    transform: [{ translateX: -150 }, { translateY: -200 }],
  },
  safeArea: { flex: 1, zIndex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 70, paddingBottom: 10,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerCenter: { alignItems: 'center' },
  headerLabel: {
    color: '#0df269', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5,
    marginBottom: 2, textTransform: 'uppercase',
  },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cardContainer: { width: CARD_WIDTH, height: '95%', justifyContent: 'center' },
  card: {
    flex: 1, backgroundColor: '#15291f', borderRadius: 32, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
    shadowColor: '#0df269', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  cardImageContainer: { height: 200, width: '100%', position: 'relative' },
  cardImage: { width: '100%', height: '100%', opacity: 0.8 },
  imageGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 100 },
  cardHeaderContent: {
    position: 'absolute', bottom: 16, left: 0, right: 0,
    paddingHorizontal: 24, alignItems: 'center',
  },
  planTitle: {
    fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center',
    marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  priceTag: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  priceLabel: { color: '#b0eac1', fontSize: 12, marginRight: 4 },
  priceValue: { color: '#0df269', fontSize: 14, fontWeight: 'bold' },
  cardBody: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  timelineItem: { flexDirection: 'row' },
  timelineLeft: { width: 40, alignItems: 'center' },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#1c3829',
    borderWidth: 1, borderColor: 'rgba(13, 242, 105, 0.3)',
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  timelineLine: {
    width: 2, backgroundColor: 'rgba(13, 242, 105, 0.3)',
    flex: 1, marginVertical: 4, borderRadius: 1,
  },
  timelineRight: { flex: 1, paddingLeft: 16, paddingTop: 4 },
  stopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  stopTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  stopPriceTag: {
    backgroundColor: 'rgba(13, 242, 105, 0.1)', paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: 6,
  },
  stopPriceText: { color: '#0df269', fontSize: 12, fontWeight: 'bold' },
  stopTime: { color: '#9ca3af', fontSize: 14, fontWeight: '500', marginBottom: 6 },
  stopDesc: { color: '#6b7280', fontSize: 12, lineHeight: 18 },
  cardFooter: { padding: 24, paddingTop: 10 },
  navigateButton: {
    height: 56, backgroundColor: '#0df269', borderRadius: 28,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingLeft: 24, shadowColor: '#0df269',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  navigateText: { color: '#102217', fontSize: 18, fontWeight: 'bold' },
  navIconCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginBottom: 40, marginTop: 5, gap: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  activeDot: {
    width: 24, backgroundColor: '#0df269', shadowColor: '#0df269',
    shadowOpacity: 0.5, shadowRadius: 8,
  },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 48, height: 48,
    borderRadius: 24, backgroundColor: '#1c3829', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
    shadowColor: 'black', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
});