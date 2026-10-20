import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * "− 10:00 +" start-time stepper in 30-minute steps, 06:00 to 23:00.
 * Plain React Native controls, so it works the same on web and mobile.
 * value / onChange use "HH:MM" strings (the format the backend expects).
 */
export const DEFAULT_START_TIME = '10:00';
const STEP_MINUTES = 30;
const EARLIEST_MINUTES = 6 * 60;
const LATEST_MINUTES = 23 * 60;

const toMinutes = (hhmm) => {
  const [hours, minutes] = String(hhmm || DEFAULT_START_TIME).split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : 10 * 60;
};

const toLabel = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export default function StartTimePicker({ value, onChange }) {
  const minutes = toMinutes(value);
  const canGoEarlier = minutes - STEP_MINUTES >= EARLIEST_MINUTES;
  const canGoLater = minutes + STEP_MINUTES <= LATEST_MINUTES;
  const step = (direction) => onChange(toLabel(minutes + direction * STEP_MINUTES));

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={() => step(-1)}
        disabled={!canGoEarlier}
        style={[styles.button, !canGoEarlier && styles.disabled]}
        accessibilityRole="button"
        accessibilityLabel="Start 30 minutes earlier"
      >
        <MaterialIcons name="remove" size={20} color="white" />
      </TouchableOpacity>
      <Text style={styles.value} accessibilityLabel={`Start time ${toLabel(minutes)}`}>{toLabel(minutes)}</Text>
      <TouchableOpacity
        onPress={() => step(1)}
        disabled={!canGoLater}
        style={[styles.button, !canGoLater && styles.disabled]}
        accessibilityRole="button"
        accessibilityLabel="Start 30 minutes later"
      >
        <MaterialIcons name="add" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  button: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  disabled: { opacity: 0.3 },
  value: { color: 'white', fontSize: 20, fontWeight: 'bold' },
});
