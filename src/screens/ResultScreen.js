import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export default function ResultScreen({ navigation }) {
  
  // Dummy Data for the Demo
  const plans = [
    { id: 1, title: 'The Chill Evening', cost: 450, time: '5:00 PM - 9:00 PM', stops: ['Sayaji Baug', 'Raju Omlet', 'Inox Movie'] },
    { id: 2, title: 'Foodie Run', cost: 600, time: '6:00 PM - 10:00 PM', stops: ['Ratribazar', 'Jassi De Parathe', 'Ice Cream'] },
    { id: 3, title: 'Nature Walk', cost: 150, time: '4:00 PM - 7:00 PM', stops: ['Kamati Baug', 'Planetarium', 'Tea Post'] },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#102217', '#050505']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top 3 Plans</Text>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView 
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
      >
        {plans.map((plan) => (
          <View key={plan.id} style={styles.card}>
            <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} style={styles.cardGradient} />
            
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planCost}>₹{plan.cost}<Text style={styles.perPerson}>/person</Text></Text>
            </View>

            {/* Timeline */}
            <View style={styles.timelineContainer}>
              <View style={styles.line} />
              {plan.stops.map((stop, index) => (
                <View key={index} style={styles.stopRow}>
                  <View style={styles.dot} />
                  <View>
                    <Text style={styles.stopTime}>Stop {index + 1}</Text>
                    <Text style={styles.stopName}>{stop}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>Select This Plan</Text>
              <MaterialIcons name="navigation" size={20} color="#102217" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#102217', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, marginRight: 16 },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  carousel: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { width: 320, height: 500, marginRight: 20, borderRadius: 30, padding: 24, justifyContent: 'space-between', overflow: 'hidden', position: 'relative' },
  cardGradient: { position: 'absolute', width: '100%', height: '100%' },
  cardHeader: { marginBottom: 20 },
  planTitle: { color: '#0df269', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  planCost: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  perPerson: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 'normal' },
  timelineContainer: { flex: 1, justifyContent: 'center', position: 'relative' },
  line: { position: 'absolute', left: 7, top: 10, bottom: 30, width: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  stopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#0df269', marginRight: 16, borderWidth: 3, borderColor: '#102217' },
  stopTime: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' },
  stopName: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  actionButton: { height: 56, backgroundColor: '#0df269', borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#102217', fontSize: 16, fontWeight: 'bold', marginRight: 8 }
});