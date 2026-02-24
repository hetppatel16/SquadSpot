import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ItineraryCard({ title, time, description }) {
  return (
    <View style={styles.card}>
      <View style={styles.timeContainer}>
        <Text style={styles.time}>{time}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timeContainer: {
    marginRight: 16,
  },
  time: {
    color: '#0df269',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  description: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});
